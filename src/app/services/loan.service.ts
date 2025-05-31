import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';

export interface LoanProduct {
    id: number;
    name: string;
    description: string;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    minTerm: number;
    maxTerm: number;
    requirements: string[];
    features: string[];
}

export interface LoanApplication {
    id?: number;
    userId?: number;
    productId: number;
    amount: number;
    term: number;
    purpose: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    additionalInfo?: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class LoanService {
    constructor(private apiService: ApiService) { }

    /**
     * Lấy danh sách sản phẩm vay
     */
    getLoanProducts(): Observable<ApiResponse<LoanProduct[]>> {
        return this.apiService.get<LoanProduct[]>('/loan-products');
    }

    /**
     * Lấy chi tiết một sản phẩm vay
     */
    getLoanProductById(id: number): Observable<ApiResponse<LoanProduct>> {
        return this.apiService.get<LoanProduct>(`/loan-products/${id}`);
    }

    /**
     * Gửi đơn đăng ký khoản vay
     */
    applyForLoan(application: LoanApplication): Observable<ApiResponse<LoanApplication>> {
        return this.apiService.post<LoanApplication>('/loan-applications', application);
    }

    /**
     * Lấy danh sách đơn đăng ký vay của người dùng
     */
    getUserApplications(): Observable<ApiResponse<LoanApplication[]>> {
        return this.apiService.get<LoanApplication[]>('/loan-applications/my-applications');
    }

    /**
     * Lấy chi tiết một đơn đăng ký vay
     */
    getApplicationById(id: number): Observable<ApiResponse<LoanApplication>> {
        return this.apiService.get<LoanApplication>(`/loan-applications/${id}`);
    }

    /**
     * Cập nhật một đơn đăng ký vay
     */
    updateApplication(id: number, data: Partial<LoanApplication>): Observable<ApiResponse<LoanApplication>> {
        return this.apiService.patch<LoanApplication>(`/loan-applications/${id}`, data);
    }

    /**
     * Hủy đơn đăng ký vay
     */
    cancelApplication(id: number): Observable<ApiResponse<void>> {
        return this.apiService.delete<void>(`/loan-applications/${id}`);
    }

    /**
     * Tính toán kế hoạch trả nợ dự kiến
     */
    calculateRepaymentPlan(amount: number, term: number, productId: number): Observable<ApiResponse<any>> {
        return this.apiService.post<any>('/loan-calculations/repayment-plan', {
            amount,
            term,
            productId
        });
    }
}
