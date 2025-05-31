import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from './auth.service'; // Đảm bảo đường dẫn import đúng

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_URL = environment.apiUrl;

    constructor(private http: HttpClient) { } // Sửa lỗi constructor

    /**
     * Thực hiện HTTP GET request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param params Tham số query string (tùy chọn)
     * @returns Observable của response nguyên trạng
     */
    get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(`${this.API_URL}${endpoint}`, { params });
    }

    /**
     * Thực hiện HTTP POST request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param body Dữ liệu gửi đi
     * @param options Tùy chọn HTTP (tùy chọn)
     * @returns Observable của response nguyên trạng
     */
    post<T>(endpoint: string, body: any, options?: any): Observable<ApiResponse<T>> {
        // Ensure observe is set to 'body' to match the expected return type
        const httpOptions = { ...(options || {}), observe: 'body' as const };
        return this.http.post<ApiResponse<T>>(`${this.API_URL}${endpoint}`, body, httpOptions);
    }

    /**
     * Thực hiện HTTP PUT request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param body Dữ liệu gửi đi
     * @param options Tùy chọn HTTP (tùy chọn)
     * @returns Observable của response nguyên trạng
     */
    put<T>(endpoint: string, body: any, options?: any): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${this.API_URL}${endpoint}`, body, options);
    }

    /**
     * Thực hiện HTTP DELETE request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param options Tùy chọn HTTP (tùy chọn)
     * @returns Observable của response nguyên trạng
     */
    delete<T>(endpoint: string, options?: any): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${this.API_URL}${endpoint}`, options);
    }
}