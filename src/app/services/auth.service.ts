import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
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
  token?: String
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
    return this.userService.isLoggedIn();
  }

  // Get authentication token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Logout user
  logout(): void {
    // Có thể thêm gọi API logout nếu backend yêu cầu
    this.apiService.post<void>('/auth/logout', { token: localStorage.getItem('authToken') }).subscribe({
      next: () => {
        console.log('User logged out successfully');
        this.userService.clearCurrentUser();
        localStorage.removeItem('authToken');
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Xử lý lỗi nếu cần, ví dụ: hiển thị thông báo lỗi
      }
    });
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
    return this.apiService.post<{ token: string }>('/auth/refresh', { token });
  }
}