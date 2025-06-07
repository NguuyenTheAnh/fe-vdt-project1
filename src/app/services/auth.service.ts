import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { UserService } from './user.service';
import { ApiService } from './api.service';

// Interfaces for API requests
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Interface for password reset request
export interface PasswordResetRequest {
  email: string;
  newPassword: string;
  token: string;
}

// Interface for API responses
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

export interface UserData {
  id?: number;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  token?: String;
  accountStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: {
    name: string;
    description?: string;
    permissions?: Array<{
      name: string;
      description?: string;
    }>;
  };
  // Add other user properties as needed
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) { }

  // Register a new user
  register(userData: RegisterRequest): Observable<ApiResponse<UserData>> {
    return this.apiService.post<UserData>('/users', userData)
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data) {
            this.userService.updateCurrentUser(response.data);
          }
        })
      );
  }

  // Login user
  login(credentials: LoginRequest): Observable<ApiResponse<UserData>> {
    return this.apiService.post<UserData>('/auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data && response.data.token) {
            // Lưu token vào localStorage
            const token = String(response.data.token);
            localStorage.setItem('authToken', token);

            // Bổ sung token vào data để đảm bảo nó được lưu trong localStorage
            const userData = {
              ...response.data,
              token: token
            };

            // Lưu thông tin người dùng từ response đăng nhập
            this.userService.updateCurrentUser(userData);

            // Gọi API để lấy thông tin profile đầy đủ ngay lập tức sau khi đăng nhập
            // Điều này đảm bảo chúng ta có thông tin role đầy đủ
            this.userService.fetchCurrentUserProfile().subscribe({
              next: (fullUserData) => {
                console.log('Full user profile loaded after login:', fullUserData);
              },
              error: (err) => {
                console.error('Error fetching full profile after login:', err);
              }
            });

            console.log('User authenticated and saved to localStorage');
          }
        })
      );
  }

  // Get current user
  getCurrentUser(): UserData | null {
    return this.userService.getCurrentUser();
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.userService.getCurrentUser();
  }

  // Lấy UserService instance
  getUserService(): UserService {
    return this.userService;
  }

  // Get authentication token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Logout user
  logout(): void {
    const token = localStorage.getItem('authToken');

    // Xóa dữ liệu trên client ngay lập tức 
    // để đảm bảo UI phản hồi ngay kể cả khi API chậm hoặc lỗi
    this.userService.clearCurrentUser();
    localStorage.removeItem('authToken');

    // Nếu có token thì thông báo cho server
    if (token) {
      // Gọi API logout nếu backend yêu cầu
      this.apiService.post<void>('/auth/logout', { token }).subscribe({
        next: () => {
          console.log('User logged out successfully on server');
        },
        error: (error) => {
          console.error('Error during logout API call:', error);
          // Chỉ log lỗi, không ảnh hưởng đến trạng thái client
        }
      });
    } else {
      console.log('No token to logout with');
    }
  }

  // Update user profile
  updateProfile(userId: number, profileData: Partial<UserData>): Observable<ApiResponse<UserData>> {
    return this.apiService.patch<UserData>(`/users/${userId}`, profileData)
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data) {
            this.userService.updateCurrentUser(response.data);
          }
        })
      );
  }

  // Change password
  changePassword(userId: number, passwordData: { oldPassword: string; newPassword: string }): Observable<ApiResponse<void>> {
    return this.apiService.post<void>(`/users/${userId}/change-password`, passwordData);
  }

  // Refresh token
  refreshToken(token: string): Observable<ApiResponse<{ token: string }>> {
    return this.apiService.post<{ token: string }>('/auth/refresh', { token })
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data && response.data.token) {
            // Log thành công
            console.log('Token refreshed successfully');
          } else {
            // Log thất bại nếu API trả về code khác 1000
            console.warn('Token refresh API returned unexpected code:', response.code);
          }
        }),
        catchError(error => {
          console.error('Error during token refresh:', error);
          // Xóa token hiện tại nếu gặp lỗi nghiêm trọng
          if (error.status === 401 || error.status === 403) {
            localStorage.removeItem('authToken');
            this.userService.clearCurrentUser();
          }
          return throwError(() => error);
        })
      );
  }

  // Password Reset Methods

  // Step 1: Send reset email
  sendPasswordResetEmail(email: string): Observable<ApiResponse<void>> {
    return this.apiService.post<void>(`/auth/password-reset/email/${email}`, {});
  }

  // Step 2: Verify reset token
  verifyPasswordResetToken(token: string): Observable<ApiResponse<boolean>> {
    return this.apiService.post<boolean>(`/auth/password-reset/token/${token}`, {});
  }

  // Step 3: Reset password with token
  resetPassword(resetData: PasswordResetRequest): Observable<ApiResponse<void>> {
    return this.apiService.post<void>('/auth/password-reset', resetData);
  }
}