import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  private readonly API_URL = environment.apiUrl;
  private currentUser: UserData | null = null;

  constructor(private http: HttpClient) { }

  // Register a new user
  register(userData: RegisterRequest): Observable<ApiResponse<UserData>> {
    return this.http.post<ApiResponse<UserData>>(`${this.API_URL}/users`, userData)
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data) {
            this.currentUser = response.data;
          }
        })
      );
  }

  // Login user
  login(credentials: LoginRequest): Observable<ApiResponse<UserData>> {
    return this.http.post<ApiResponse<UserData>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.code === 1000 && response.data) {
            this.currentUser = response.data;
            this.saveUserToLocalStorage(response.data);
          }
        })
      );
  }

  // Get current user
  getCurrentUser(): UserData | null {
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  // Get authentication token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Logout user
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  // Save user data to localStorage
  private saveUserToLocalStorage(user: UserData): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Lưu token riêng để dễ truy cập
    if (user.token) {
      localStorage.setItem('authToken', String(user.token));
    }
  }
}