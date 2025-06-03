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
    status: string;
    requiredDocuments: string;
    createdAt: string;
    updatedAt: string;
    requirements?: string[];
    features?: string[];
}

export interface PageableResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            empty: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    first: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        empty: boolean;
        unsorted: boolean;
    };
    numberOfElements: number;
    empty: boolean;
}

export interface LoanApplication {
    id?: number;
    userId?: number;
    productId?: number;
    requestedAmount: number;
    requestedTerm: number;
    personalInfo: string; // Dạng JSON string với format: {"Thu nhập":15000000,"Nghề nghiệp":"Nhân viên văn phòng"}
    status?: string;
    disbursedAmount?: number | null;
    disbursedDate?: string | null;
    internalNotes?: string | null;
    createdAt?: string;
    updatedAt?: string;
    loanProduct?: LoanProduct;
    user?: {
        id: number;
        email: string;
        fullName: string;
        phoneNumber: string;
        address: string;
        accountStatus: string;
        createdAt: string;
        updatedAt: string;
        role?: {
            name: string;
            description: string;
            permissions: {
                name: string;
                description: string;
            }[];
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class LoanService {
    constructor(private apiService: ApiService) { }
    getLoanProducts(page: number = 0, size: number = 10, sort: string = "id,desc"): Observable<ApiResponse<PageableResponse<LoanProduct>>> {
        return this.apiService.get<PageableResponse<LoanProduct>>(`/loan-products?page=${page}&size=${size}&sort=${sort}`);
    }

    /**
     * Lấy chi tiết một sản phẩm vay
     */
    getLoanProductById(id: number): Observable<ApiResponse<LoanProduct>> {
        return this.apiService.get<LoanProduct>(`/loan-products/${id}`);
    }    /**
     * Gửi đơn đăng ký khoản vay
     * @param application object chứa productId, requestedAmount, requestedTerm, personalInfo
     * @returns Observable chứa kết quả đăng ký khoản vay
     */
    applyForLoan(application: LoanApplication): Observable<ApiResponse<LoanApplication>> {
        return this.apiService.post<LoanApplication>('/loan-applications', application);
    }

    /**
     * Lấy danh sách đơn đăng ký vay của người dùng với phân trang
     * @param page Số trang, mặc định là 0
     * @param size Số lượng phần tử mỗi trang, mặc định là 10
     * @param sort Thuộc tính và hướng sắp xếp, mặc định là "createdAt,desc"
     * @returns Observable chứa danh sách đơn đăng ký vay của người dùng
     */
    getUserApplications(page: number = 0, size: number = 10, sort: string = "createdAt,desc"): Observable<ApiResponse<PageableResponse<LoanApplication>>> {
        return this.apiService.get<PageableResponse<LoanApplication>>(`/loan-applications/user?page=${page}&size=${size}&sort=${sort}`);
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
    }    /**
     * Hủy đơn đăng ký vay
     */
    cancelApplication(id: number): Observable<ApiResponse<void>> {
        return this.apiService.delete<void>(`/loan-applications/${id}`);
    }

    /**
     * Cập nhật thông tin sản phẩm vay
     * @param id ID sản phẩm vay cần cập nhật
     * @param data Dữ liệu cập nhật cho sản phẩm vay
     * @returns Observable chứa sản phẩm vay đã cập nhật
     */
    updateLoanProduct(id: number, data: Partial<LoanProduct>): Observable<ApiResponse<LoanProduct>> {
        return this.apiService.put<LoanProduct>(`/loan-products/${id}`, data);
    }    /**
     * Tính toán kế hoạch trả nợ dự kiến
     */
    calculateRepaymentPlan(amount: number, term: number, productId: number): Observable<ApiResponse<any>> {
        return this.apiService.post<any>('/loan-calculations/repayment-plan', {
            amount,
            term,
            productId
        });
    }

    /**
     * Lấy danh sách tài liệu yêu cầu và trạng thái của chúng
     * @param loanApplicationId ID của đơn đăng ký vay
     * @returns Observable chứa map các tài liệu và trạng thái của chúng
     */
    getRequiredDocuments(loanApplicationId: number): Observable<ApiResponse<Record<string, string | null>>> {
        return this.apiService.get<Record<string, string | null>>(`/loan-applications/required-documents/${loanApplicationId}`);
    }
}
