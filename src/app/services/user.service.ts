import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserData } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<UserData | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private apiService: ApiService) { }    /**
     * Lấy thông tin profile của người dùng đang đăng nhập
     */    fetchCurrentUserProfile(): Observable<UserData | null> {
        // Kiểm tra nếu có token thì mới gọi API
        const token = localStorage.getItem('authToken');
        const currentUser = this.currentUserSubject.value;

        if (!token) {
            console.log('No token found, cannot fetch profile');
            // Nếu không có token, xóa thông tin người dùng nếu có
            this.clearCurrentUser();
            return of(null);
        }

        console.log('Fetching current user profile from API');
        return this.apiService.get<UserData>('/auth/my-profile').pipe(
            tap(response => {
                if (response && response.code === 1000 && response.data) {
                    // Kết hợp thông tin người dùng với token và bảo toàn các trường khác nếu có
                    const userData: UserData = {
                        ...(currentUser || {}),  // Giữ lại các trường cũ nếu có
                        ...response.data,        // Cập nhật từ response mới
                        token: token             // Đảm bảo token được lưu cùng thông tin người dùng
                    };

                    // Cập nhật thông tin người dùng vào BehaviorSubject
                    this.currentUserSubject.next(userData);

                    // Lưu thông tin người dùng vào localStorage
                    this.saveUserToLocalStorage(userData);

                    console.log('User profile updated and saved to localStorage');
                } else {
                    console.warn('Invalid user data from API:', response);
                    // Nếu API không trả về data hợp lệ nhưng vẫn có user data cũ, giữ nguyên
                    if (currentUser) {
                        console.log('Keeping existing user data');
                    } else {
                        console.warn('No existing user data, clearing authentication');
                        localStorage.removeItem('authToken');
                        this.clearCurrentUser();
                    }
                }
            }),
            // Map the ApiResponse<UserData> to UserData | null
            map(response => {
                if (response && response.code === 1000 && response.data) {
                    return {
                        ...(currentUser || {}),
                        ...response.data,
                        token: token
                    };
                }
                return null;
            }),
            catchError(error => {
                console.error('Error fetching user profile:', error);

                // Xử lý các lỗi xác thực
                if (error.status === 401 || error.status === 403) {
                    console.warn('Authentication error, clearing credentials');
                    localStorage.removeItem('authToken');
                    this.clearCurrentUser();
                    return of(null);
                }

                // Với các lỗi khác (như lỗi mạng), giữ nguyên thông tin hiện có và trả về user hiện tại
                console.log('Network or server error, keeping existing session if available');
                return of(currentUser);
            })
        );
    }

    /**
     * Lấy thông tin người dùng hiện tại
     */
    getCurrentUser(): UserData | null {
        return this.currentUserSubject.value;
    }    /**
     * Cập nhật thông tin người dùng trong local storage và state
     */
    updateCurrentUser(user: UserData): void {
        this.currentUserSubject.next(user);
        this.saveUserToLocalStorage(user);
    }

    /**
     * Cập nhật thông tin người dùng thông qua API
     */
    updateUserProfile(updateData: any): Observable<any> {
        return this.apiService.patch<any>('/users', updateData)
            .pipe(
                tap(response => {
                    if (response && response.code === 1000 && response.data) {
                        // Cập nhật thông tin người dùng hiện tại với dữ liệu mới
                        const currentUser = this.currentUserSubject.value;
                        if (currentUser) {
                            const updatedUser = {
                                ...currentUser,
                                ...response.data
                            };
                            this.updateCurrentUser(updatedUser);
                        }
                    }
                })
            );
    }

    /**
     * Xóa thông tin người dùng hiện tại (logout)
     */
    clearCurrentUser(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
    }

    /**
     * Kiểm tra xem có người dùng đang đăng nhập không
     */
    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    /**
     * Lưu thông tin người dùng vào localStorage
     */
    private saveUserToLocalStorage(user: UserData): void {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }    /**
     * Khởi tạo thông tin người dùng từ localStorage (gọi khi khởi động app)
     */
    initializeFromLocalStorage(): void {
        console.log('Initializing user from localStorage');

        const storedUser = localStorage.getItem('currentUser');
        const authToken = localStorage.getItem('authToken');

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);

                // Đảm bảo token trong user data khớp với token trong localStorage
                if (authToken && (!user.token || user.token !== authToken)) {
                    console.log('Updating token in user data to match localStorage');
                    user.token = authToken;
                    this.saveUserToLocalStorage(user);
                }

                // Ngay cả khi không có token, vẫn đặt user vào BehaviorSubject để hiển thị UI đúng
                // Việc xác thực token sẽ được xử lý sau bởi fetchCurrentUserProfile
                this.currentUserSubject.next(user);
                console.log('User initialized from localStorage:', user.fullName);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                if (authToken) {
                    console.log('Found valid token but corrupted user data');
                    // Không xóa token nếu có token hợp lệ
                } else {
                    localStorage.removeItem('currentUser');
                }
            }
        } else if (authToken) {
            // Có token nhưng không có user data, tạo user tạm thời để hiển thị UI đã đăng nhập
            console.log('Found token but no user data, creating temporary user');
            const tempUser: UserData = { token: authToken };
            this.currentUserSubject.next(tempUser);
            // fetchCurrentUserProfile sẽ được gọi từ AppComponent để lấy đầy đủ thông tin
        }
    }
}
