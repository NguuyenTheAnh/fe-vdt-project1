import { Injectable, Injector } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from './auth.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(
        private router: Router,
        private notification: NzNotificationService,
        private injector: Injector
    ) { } intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Danh sách các URL không bao giờ cần token
        const alwaysPublicUrls = [
            '/auth/login',
            '/auth/refresh'
        ];

        // Kiểm tra xem request có thuộc danh sách luôn public không
        const isAlwaysPublic = alwaysPublicUrls.some(url => request.url.includes(url));

        // Lấy token từ localStorage
        const token = localStorage.getItem('authToken');

        // Logic thêm token:
        // 1. Nếu là request luôn public (login, refresh) -> không thêm token
        // 2. Nếu có token -> thêm token (bao gồm cả admin tạo user và user registration có token)
        // 3. Nếu không có token -> không thêm token (user registration từ trang public)
        if (!isAlwaysPublic && token) {
            // Thêm token vào header
            request = this.addTokenToRequest(request, token);
        }        // Xử lý response và bắt các lỗi xác thực
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Log lỗi để debug (giảm log không cần thiết)
                if (error.status !== 0) { // Bỏ qua lỗi mạng
                    console.error(`Error ${error.status} for request ${request.url}`);
                }                // Chỉ xử lý lỗi 401 (Unauthorized) nếu không phải là request luôn public
                // và có token (tức là user đã đăng nhập)
                if (error.status === 401 && !isAlwaysPublic && token) {
                    console.log('Received 401 error, attempting to refresh token');
                    // Thử refresh token
                    return this.handleTokenRefresh(request, next);
                }

                // Xử lý lỗi 403 (Forbidden) cho người quản lý
                if (error.status === 403 && token) {
                    this.handle403Error();
                    return throwError(() => error);
                }

                return throwError(() => error);
            })
        );
    }    // Hàm xử lý lỗi 403 Forbidden cho người quản lý
    private handle403Error(): void {
        // Lấy AuthService thông qua Injector để tránh circular dependency
        const authService = this.injector.get(AuthService);

        // Kiểm tra xem người dùng hiện tại có phải là admin không
        const currentUser = authService.getCurrentUser();
        const isAdmin = currentUser && currentUser.role && currentUser.role.name !== 'USER';

        if (isAdmin) {
            // Điều hướng đến trang access-denied
            setTimeout(() => {
                this.router.navigate(['/admin/access-denied']);
            }, 100);
        }
    }

    // Hàm xử lý refresh token
    private handleTokenRefresh(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            // Lấy AuthService thông qua Injector để tránh circular dependency
            const authService = this.injector.get(AuthService);
            const token = localStorage.getItem('authToken');

            if (!token) {
                return this.logoutAndRedirect();
            }

            console.log('Trying to refresh the token...');
            return authService.refreshToken(token).pipe(
                switchMap((response) => {
                    this.isRefreshing = false;

                    if (response && response.code === 1000 && response.data && response.data.token) {
                        const newToken = response.data.token;
                        console.log('Token refreshed successfully');

                        // Lưu token mới vào localStorage
                        localStorage.setItem('authToken', newToken);

                        // Cập nhật token trong thông tin người dùng và đảm bảo dữ liệu profile là mới nhất
                        authService['userService'].fetchCurrentUserProfile().subscribe({
                            next: (userData) => {
                                console.log('User profile refreshed after token refresh');
                            },
                            error: (error) => {
                                console.error('Error refreshing user profile after token refresh:', error);
                            }
                        });

                        // Thông báo thành công
                        this.refreshTokenSubject.next(newToken);

                        // Gửi lại request với token mới
                        return next.handle(this.addTokenToRequest(request, newToken));
                    } else {
                        console.warn('Failed to refresh token');
                        return this.logoutAndRedirect();
                    }
                }),
                catchError((error) => {
                    console.error('Error refreshing token:', error);
                    this.isRefreshing = false;
                    // Xóa token và đăng xuất nếu không thể refresh
                    return this.logoutAndRedirect();
                }),
                // Đảm bảo isRefreshing được reset kể cả khi có lỗi không xử lý được
                finalize(() => {
                    this.isRefreshing = false;
                })
            );
        } else {
            // Đang trong quá trình refresh token, chờ kết quả
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(token => {
                    return next.handle(this.addTokenToRequest(request, token));
                })
            );
        }
    }

    // Hàm thêm token vào request
    private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }    // Hàm xử lý logout và chuyển hướng
    private logoutAndRedirect(): Observable<HttpEvent<any>> {
        // Lấy AuthService thông qua Injector để tránh circular dependency
        const authService = this.injector.get(AuthService);

        // Gọi phương thức logout chính thức qua AuthService
        authService.logout();

        // Hiển thị thông báo
        this.notification.error(
            'Phiên đăng nhập đã hết hạn',
            'Vui lòng đăng nhập lại để tiếp tục.',
            { nzDuration: 5000 }
        );

        // Đợi một chút trước khi chuyển hướng để đảm bảo thông báo được hiển thị
        setTimeout(() => {
            // Chuyển hướng về trang đăng nhập
            this.router.navigate(['/login']);
        }, 100);

        return throwError(() => new Error('Session expired'));
    }
}
