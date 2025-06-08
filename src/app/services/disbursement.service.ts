import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

// Interfaces for Disbursement Management

// Request Interfaces
export interface CreateDisbursementRequest {
  applicationId: number;
  amount: number;
  transactionDate?: string; // ISO date string, optional
  notes?: string;
}

// Response Interfaces
export interface LoanApplicationInfo {
  id: number;
  status: string;
  requestedAmount: number;
  userId: number;
  userEmail: string;
  productId: number;
  productName: string;
}

export interface DisbursementResponse {
  transactionId: number;
  applicationId: number;
  amount: number;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  loanApplication?: LoanApplicationInfo;
}

export interface DisbursementSummaryResponse {
  applicationId: number;
  totalDisbursedAmount: number;
  requestedAmount: number;
  remainingAmount: number;
  transactionCount: number;
  isFullyDisbursed: boolean;
  transactions: DisbursementResponse[];
}

// Paginated Response Interface
export interface PagedDisbursementResponse {
  content: DisbursementResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Query Parameters Interface
export interface GetDisbursementsParams {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisbursementService {

  constructor(private apiService: ApiService) { }

  /**
   * 1. Create Disbursement Transaction
   * POST /disbursements
   * @param request CreateDisbursementRequest
   * @returns Observable<DisbursementResponse>
   */
  createDisbursement(request: CreateDisbursementRequest): Observable<DisbursementResponse | null> {
    return this.apiService.post<DisbursementResponse>('/disbursements', request).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error creating disbursement:', error);
        return of(null);
      })
    );
  }

  /**
   * 2. Get Disbursement by ID
   * GET /disbursements/{transactionId}
   * @param transactionId number
   * @returns Observable<DisbursementResponse>
   */
  getDisbursementById(transactionId: number): Observable<DisbursementResponse | null> {
    return this.apiService.get<DisbursementResponse>(`/disbursements/${transactionId}`).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching disbursement by ID:', error);
        return of(null);
      })
    );
  }

  /**
   * 3. Get All Disbursements (Admin)
   * GET /disbursements
   * @param params GetDisbursementsParams
   * @returns Observable<PagedDisbursementResponse>
   */
  getAllDisbursements(params?: GetDisbursementsParams): Observable<PagedDisbursementResponse | null> {
    const queryParams: any = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.sort) queryParams.sort = params.sort;

    return this.apiService.get<PagedDisbursementResponse>('/disbursements', queryParams).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching all disbursements:', error);
        return of(null);
      })
    );
  }

  /**
   * 4. Get Disbursements by Application
   * GET /disbursements/application/{applicationId}
   * @param applicationId number
   * @param params GetDisbursementsParams
   * @returns Observable<PagedDisbursementResponse>
   */
  getDisbursementsByApplication(applicationId: number, params?: GetDisbursementsParams): Observable<PagedDisbursementResponse | null> {
    const queryParams: any = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;

    return this.apiService.get<PagedDisbursementResponse>(`/disbursements/application/${applicationId}`, queryParams).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching disbursements by application:', error);
        return of(null);
      })
    );
  }

  /**
   * 5. Get My Disbursements (Current User)
   * GET /disbursements/my
   * @param params GetDisbursementsParams
   * @returns Observable<PagedDisbursementResponse>
   */
  getMyDisbursements(params?: GetDisbursementsParams): Observable<PagedDisbursementResponse | null> {
    const queryParams: any = {};

    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;

    return this.apiService.get<PagedDisbursementResponse>('/disbursements/my', queryParams).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching my disbursements:', error);
        return of(null);
      })
    );
  }

  /**
   * 6. Get Disbursement Summary
   * GET /disbursements/summary/{applicationId}
   * @param applicationId number
   * @returns Observable<DisbursementSummaryResponse>
   */
  getDisbursementSummary(applicationId: number): Observable<DisbursementSummaryResponse | null> {
    return this.apiService.get<DisbursementSummaryResponse>(`/disbursements/summary/${applicationId}`).pipe(
      map(response => {
        if (response && response.code === 1000 && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching disbursement summary:', error);
        return of(null);
      })
    );
  }

  /**
   * 7. Delete Disbursement Transaction
   * DELETE /disbursements/{transactionId}
   * @param transactionId number
   * @returns Observable<boolean>
   */
  deleteDisbursement(transactionId: number): Observable<boolean> {
    return this.apiService.delete<void>(`/disbursements/${transactionId}`).pipe(
      map(response => {
        return response && response.code === 1000;
      }),
      catchError(error => {
        console.error('Error deleting disbursement:', error);
        return of(false);
      })
    );
  }

  // Helper Methods

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
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Validate disbursement request
   * @param request CreateDisbursementRequest
   * @returns { valid: boolean, errors: string[] }
   */
  validateDisbursementRequest(request: CreateDisbursementRequest): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!request.applicationId || request.applicationId <= 0) {
      errors.push('ID đơn vay không hợp lệ');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Số tiền giải ngân phải lớn hơn 0');
    }

    if (request.transactionDate) {
      const date = new Date(request.transactionDate);
      if (isNaN(date.getTime())) {
        errors.push('Ngày giao dịch không hợp lệ');
      }
    }

    if (request.notes && request.notes.length > 500) {
      errors.push('Ghi chú không được vượt quá 500 ký tự');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate disbursement progress percentage
   * @param disbursedAmount number
   * @param totalAmount number
   * @returns number
   */
  calculateProgress(disbursedAmount: number, totalAmount: number): number {
    if (totalAmount <= 0) return 0;
    return Math.min(100, Math.round((disbursedAmount / totalAmount) * 100));
  }

  /**
   * Check if disbursement is fully completed
   * @param disbursedAmount number
   * @param totalAmount number
   * @returns boolean
   */
  isFullyDisbursed(disbursedAmount: number, totalAmount: number): boolean {
    return disbursedAmount >= totalAmount;
  }

  /**
   * Get remaining amount to be disbursed
   * @param requestedAmount number
   * @param disbursedAmount number
   * @returns number
   */
  getRemainingAmount(requestedAmount: number, disbursedAmount: number): number {
    return Math.max(0, requestedAmount - disbursedAmount);
  }

  /**
   * Get disbursement status label
   * @param isFullyDisbursed boolean
   * @returns string
   */
  getDisbursementStatusLabel(isFullyDisbursed: boolean): string {
    return isFullyDisbursed ? 'Đã giải ngân hoàn tất' : 'Giải ngân một phần';
  }

  /**
   * Get disbursement status color class
   * @param isFullyDisbursed boolean
   * @returns string
   */
  getDisbursementStatusColorClass(isFullyDisbursed: boolean): string {
    return isFullyDisbursed
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }

  /**
   * Get progress bar color class based on progress percentage
   * @param progress number
   * @returns string
   */
  getProgressColorClass(progress: number): string {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  }

  /**
   * Format transaction date for display
   * @param dateString string
   * @returns string
   */
  formatTransactionDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return this.formatDate(dateString);
    }
  }

  /**
   * Generate disbursement notes suggestions
   * @param isFirst boolean
   * @param isLast boolean
   * @param progress number
   * @returns string[]
   */
  getDisbursementNotesSuggestions(isFirst: boolean, isLast: boolean, progress: number): string[] {
    const suggestions: string[] = [];

    if (isFirst) {
      suggestions.push('Giải ngân lần đầu - Khởi tạo khoản vay');
      suggestions.push('Giải ngân một phần đầu tiên');
    }

    if (isLast) {
      suggestions.push('Giải ngân cuối cùng - Hoàn tất khoản vay');
      suggestions.push('Giải ngân hoàn tất toàn bộ số tiền');
    }

    if (!isFirst && !isLast) {
      suggestions.push(`Giải ngân lần ${Math.floor(progress / 25) + 1}`);
      suggestions.push('Tiếp tục giải ngân theo yêu cầu');
    }

    suggestions.push('Giải ngân theo đúng hợp đồng');
    suggestions.push('Chuyển tiền cho khách hàng');

    return suggestions;
  }
}
