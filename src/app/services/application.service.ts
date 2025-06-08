import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';

// Enums
export enum LoanApplicationStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  REQUIRE_MORE_INFO = 'REQUIRE_MORE_INFO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_DISBURSED = 'PARTIALLY_DISBURSED',
  FULLY_DISBURSED = 'FULLY_DISBURSED'
}

// Request Interfaces
export interface LoanApplicationRequest {
  productId: number;
  requestedAmount: number;
  requestedTerm: number;
  personalInfo: string;
  status?: LoanApplicationStatus;
  internalNotes?: string;
}

export interface UpdateLoanApplicationRequest {
  productId?: number;
  requestedAmount?: number;
  requestedTerm?: number;
  personalInfo?: string;
  status?: LoanApplicationStatus;
  internalNotes?: string;
}

// Response Interfaces
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
}

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  role: {
    name: string;
    description: string;
    permissions: Array<{
      name: string;
      description: string;
    }>;
  };
}

export interface LoanApplicationResponse {
  id: number;
  requestedAmount: number;
  requestedTerm: number;
  personalInfo: string;
  status: LoanApplicationStatus;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  loanProduct: LoanProduct;
  user: UserInfo;
}

// Paginated Response Interface
export interface PagedLoanApplicationResponse {
  content: LoanApplicationResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Query Parameters Interface
export interface GetLoanApplicationsParams {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private apiService: ApiService) { }

  /**
   * 1. Create Loan Application
   * POST /loan-applications/
   * @param request LoanApplicationRequest
   * @returns Observable<LoanApplicationResponse>
   */
  createLoanApplication(request: LoanApplicationRequest): Observable<LoanApplicationResponse | null> {
    return this.apiService.post<LoanApplicationResponse>('/loan-applications', request).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error creating loan application:', error);
        return of(null);
      })
    );
  }

  /**
   * 2. Get All Loan Applications (Admin)
   * GET /loan-applications/
   * @param params GetLoanApplicationsParams
   * @returns Observable<PagedLoanApplicationResponse>
   */
  getAllLoanApplications(params?: GetLoanApplicationsParams): Observable<PagedLoanApplicationResponse | null> {
    const queryParams: any = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.sort) queryParams.sort = params.sort;

    return this.apiService.get<PagedLoanApplicationResponse>('/loan-applications', queryParams).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching all loan applications:', error);
        return of(null);
      })
    );
  }

  /**
   * 3. Get Required Documents for a Loan Product
   * GET /loan-applications/required-documents/{id}
   * @param applicationId number
   * @returns Observable<Map<string, any>>
   */
  getRequiredDocuments(applicationId: number): Observable<{ [key: string]: any } | null> {
    return this.apiService.get<{ [key: string]: any }>(`/loan-applications/required-documents/${applicationId}`).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching required documents:', error);
        return of(null);
      })
    );
  }

  /**
   * 4. Get Loan Applications for Current User
   * GET /loan-applications/user
   * @param params GetLoanApplicationsParams
   * @returns Observable<PagedLoanApplicationResponse>
   */
  getCurrentUserLoanApplications(params?: GetLoanApplicationsParams): Observable<PagedLoanApplicationResponse | null> {
    const queryParams: any = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.sort) queryParams.sort = params.sort;

    return this.apiService.get<PagedLoanApplicationResponse>('/loan-applications/user', queryParams).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching current user loan applications:', error);
        return of(null);
      })
    );
  }

  /**
   * 5. Get Loan Application by ID
   * GET /loan-applications/{id}
   * @param id number
   * @returns Observable<LoanApplicationResponse>
   */
  getLoanApplicationById(id: number): Observable<LoanApplicationResponse | null> {
    return this.apiService.get<LoanApplicationResponse>(`/loan-applications/${id}`).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching loan application by ID:', error);
        return of(null);
      })
    );
  }

  /**
   * 6. Update Loan Application
   * PATCH /loan-applications/{id}
   * @param id number
   * @param request UpdateLoanApplicationRequest
   * @returns Observable<LoanApplicationResponse>
   */
  updateLoanApplication(id: number, request: UpdateLoanApplicationRequest): Observable<LoanApplicationResponse | null> {
    return this.apiService.patch<LoanApplicationResponse>(`/loan-applications/${id}`, request).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error updating loan application:', error);
        return of(null);
      })
    );
  }

  /**
   * 7. Update Loan Application Status
   * PATCH /loan-applications/{id}/status
   * @param id number
   * @param status LoanApplicationStatus
   * @returns Observable<LoanApplicationResponse>
   */
  updateLoanApplicationStatus(id: number, status: LoanApplicationStatus): Observable<LoanApplicationResponse | null> {
    return this.apiService.patch<LoanApplicationResponse>(`/loan-applications/${id}/status`, null, {
      params: { status: status }
    }).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error updating loan application status:', error);
        return of(null);
      })
    );
  }

  /**
   * 8. Admin Update Loan Application Status with Management Features
   * PATCH /loan-applications/{id}/status/manage
   * @param id number
   * @param status LoanApplicationStatus
   * @param internalNotes string (optional)
   * @returns Observable<LoanApplicationResponse>
   */
  updateLoanApplicationStatusWithManagement(
    id: number,
    status: LoanApplicationStatus,
    internalNotes?: string
  ): Observable<LoanApplicationResponse | null> {
    const params: any = { status: status };
    if (internalNotes) {
      params.internal_notes = internalNotes;
    }

    return this.apiService.patch<LoanApplicationResponse>(`/loan-applications/${id}/status/manage`, null, {
      params: params
    }).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error updating loan application status with management features:', error);
        return of(null);
      })
    );
  }

  /**
   * 9. Delete Loan Application by ID
   * DELETE /loan-applications/{id}
   * @param id number
   * @returns Observable<boolean>
   */
  deleteLoanApplication(id: number): Observable<boolean> {
    return this.apiService.delete<void>(`/loan-applications/${id}`).pipe(
      map(response => {
        return response && response.code === 1000;
      }),
      catchError(error => {
        console.error('Error deleting loan application:', error);
        return of(false);
      })
    );
  }

  // Helper Methods

  /**
   * Get status label in Vietnamese
   * @param status LoanApplicationStatus
   * @returns string
   */
  getStatusLabel(status: LoanApplicationStatus): string {
    const statusLabels: Record<LoanApplicationStatus, string> = {
      [LoanApplicationStatus.NEW]: 'Mới',
      [LoanApplicationStatus.PENDING]: 'Đang xử lý',
      [LoanApplicationStatus.REQUIRE_MORE_INFO]: 'Cần thêm thông tin',
      [LoanApplicationStatus.APPROVED]: 'Đã duyệt',
      [LoanApplicationStatus.REJECTED]: 'Bị từ chối',
      [LoanApplicationStatus.PARTIALLY_DISBURSED]: 'Giải ngân một phần',
      [LoanApplicationStatus.FULLY_DISBURSED]: 'Đã giải ngân hoàn tất'
    };
    return statusLabels[status] || status;
  }

  /**
   * Get status color class for styling
   * @param status LoanApplicationStatus
   * @returns string
   */
  getStatusColorClass(status: LoanApplicationStatus): string {
    const statusColors: Record<LoanApplicationStatus, string> = {
      [LoanApplicationStatus.NEW]: 'bg-blue-100 text-blue-800 border-blue-200',
      [LoanApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [LoanApplicationStatus.REQUIRE_MORE_INFO]: 'bg-orange-100 text-orange-800 border-orange-200',
      [LoanApplicationStatus.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
      [LoanApplicationStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
      [LoanApplicationStatus.PARTIALLY_DISBURSED]: 'bg-purple-100 text-purple-800 border-purple-200',
      [LoanApplicationStatus.FULLY_DISBURSED]: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Format currency to Vietnamese format
   * @param amount number
   * @returns string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Format date to Vietnamese format
   * @param dateString string
   * @returns string
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Chưa cập nhật';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  }

  /**
   * Validate loan application request
   * @param request LoanApplicationRequest
   * @returns { valid: boolean, errors: string[] }
   */
  validateLoanApplicationRequest(request: LoanApplicationRequest): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!request.productId || request.productId <= 0) {
      errors.push('ID sản phẩm vay không hợp lệ');
    }

    if (!request.requestedAmount || request.requestedAmount < 1) {
      errors.push('Số tiền vay phải lớn hơn 0');
    }

    if (!request.requestedTerm || request.requestedTerm < 1) {
      errors.push('Thời hạn vay phải lớn hơn 0 tháng');
    }

    if (!request.personalInfo || request.personalInfo.trim().length < 10) {
      errors.push('Thông tin cá nhân phải có ít nhất 10 ký tự');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a status can be changed to another status
   * @param currentStatus LoanApplicationStatus
   * @param newStatus LoanApplicationStatus
   * @returns boolean
   */
  canChangeStatus(currentStatus: LoanApplicationStatus, newStatus: LoanApplicationStatus): boolean {
    // Cannot change from REJECTED to any other status except REJECTED
    if (currentStatus === LoanApplicationStatus.REJECTED && newStatus !== LoanApplicationStatus.REJECTED) {
      return false;
    }
    return true;
  }

  /**
   * Check if a status indicates the application is disbursed
   * @param status LoanApplicationStatus
   * @returns boolean
   */
  isDisburseStatus(status: LoanApplicationStatus): boolean {
    return status === LoanApplicationStatus.PARTIALLY_DISBURSED ||
      status === LoanApplicationStatus.FULLY_DISBURSED;
  }

  /**
   * Check if a status indicates the application is in final state
   * @param status LoanApplicationStatus
   * @returns boolean
   */
  isFinalStatus(status: LoanApplicationStatus): boolean {
    return status === LoanApplicationStatus.REJECTED ||
      status === LoanApplicationStatus.FULLY_DISBURSED;
  }

  /**
   * Get all available status options for dropdown/select
   * @returns Array<{value: LoanApplicationStatus, label: string}>
   */
  getStatusOptions(): Array<{ value: LoanApplicationStatus, label: string }> {
    return [
      { value: LoanApplicationStatus.NEW, label: this.getStatusLabel(LoanApplicationStatus.NEW) },
      { value: LoanApplicationStatus.PENDING, label: this.getStatusLabel(LoanApplicationStatus.PENDING) },
      { value: LoanApplicationStatus.REQUIRE_MORE_INFO, label: this.getStatusLabel(LoanApplicationStatus.REQUIRE_MORE_INFO) },
      { value: LoanApplicationStatus.APPROVED, label: this.getStatusLabel(LoanApplicationStatus.APPROVED) },
      { value: LoanApplicationStatus.REJECTED, label: this.getStatusLabel(LoanApplicationStatus.REJECTED) },
      { value: LoanApplicationStatus.PARTIALLY_DISBURSED, label: this.getStatusLabel(LoanApplicationStatus.PARTIALLY_DISBURSED) },
      { value: LoanApplicationStatus.FULLY_DISBURSED, label: this.getStatusLabel(LoanApplicationStatus.FULLY_DISBURSED) }
    ];
  }
}
