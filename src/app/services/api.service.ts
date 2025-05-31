// filepath: d:\Web dev\Project_VDT_1\frontend\src\app\services\api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from './auth.service';

/**
 * Interface xác định các tùy chọn HTTP cho các phương thức API
 */
interface HttpOptions {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: string | number | boolean | readonly (string | number | boolean)[] };
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_URL = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Thực hiện HTTP GET request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param params Tham số query string (tùy chọn)
     * @returns Observable của response
     */
    get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(`${this.API_URL}${endpoint}`, {
            params,
            observe: 'body'
        });
    }

    /**
     * Thực hiện HTTP POST request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param body Dữ liệu gửi đi
     * @param options Các tùy chọn HTTP (headers, params)
     * @returns Observable của response
     */
    post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(`${this.API_URL}${endpoint}`, body, {
            ...options,
            observe: 'body'
        });
    }

    /**
     * Thực hiện HTTP PUT request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param body Dữ liệu gửi đi
     * @param options Các tùy chọn HTTP (headers, params)
     * @returns Observable của response
     */
    put<T>(endpoint: string, body: any, options?: HttpOptions): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${this.API_URL}${endpoint}`, body, {
            ...options,
            observe: 'body'
        });
    }

    /**
     * Thực hiện HTTP DELETE request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param options Các tùy chọn HTTP (headers, params)
     * @returns Observable của response
     */
    delete<T>(endpoint: string, options?: HttpOptions): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${this.API_URL}${endpoint}`, {
            ...options,
            observe: 'body'
        });
    }

    /**
     * Thực hiện HTTP PATCH request
     * @param endpoint URL endpoint không bao gồm API_URL
     * @param body Dữ liệu gửi đi (chỉ những trường cần cập nhật)
     * @param options Các tùy chọn HTTP (headers, params)
     * @returns Observable của response
     */
    patch<T>(endpoint: string, body: any, options?: HttpOptions): Observable<ApiResponse<T>> {
        return this.http.patch<ApiResponse<T>>(`${this.API_URL}${endpoint}`, body, {
            ...options,
            observe: 'body'
        });
    }
}
