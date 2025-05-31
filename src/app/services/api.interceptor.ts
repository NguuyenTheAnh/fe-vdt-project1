import { Injectable, Injector } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
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
    ) { }
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Bỏ qua các request refresh token để tránh vòng lặp vô hạn
        if (request.url.includes('/auth/refresh')) {
            return next.handle(request);
        }

        // Lấy token từ localStorage
        const token = localStorage.getItem('authToken');

        // Log để debug
        console.log(`Processing request to: ${request.url}`);

        // Thêm token vào header nếu có
        if (token) {
            console.log(`Adding auth token to request: ${request.url}`);
            request = this.addTokenToRequest(request, token);
        } else {
            console.warn(`No auth token available for request: ${request.url}`);
        }

        // Xử lý response và bắt các lỗi xác thực
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Log lỗi để debug
                console.error(`Error ${error.status} for request ${request.url}:`, error.message);

                // Chỉ xử lý lỗi 401 nếu không phải là request đến API login hoặc register
                if (error.status === 401 &&
                    !request.url.includes('/auth/login') &&
                    !request.url.includes('/users')) {

                    // Thử refresh token
                    return this.handleTokenRefresh(request, next);
                }

                return throwError(() => error);
            })
        );
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

                        // Cập nhật token trong thông tin người dùng
                        const userData = authService.getCurrentUser();
                        if (userData) {
                            const updatedUserData = { ...userData, token: newToken };
                            authService['userService'].updateCurrentUser(updatedUserData);
                        }

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
                    return this.logoutAndRedirect();
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
    }

    // Hàm xử lý logout và chuyển hướng
    private logoutAndRedirect(): Observable<HttpEvent<any>> {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');

        // Hiển thị thông báo
        this.notification.error(
            'Phiên đăng nhập đã hết hạn',
            'Vui lòng đăng nhập lại để tiếp tục.',
            { nzDuration: 5000 }
        );

        // Chuyển hướng về trang đăng nhập
        this.router.navigate(['/login']);

        return throwError(() => new Error('Session expired'));
    }
}
