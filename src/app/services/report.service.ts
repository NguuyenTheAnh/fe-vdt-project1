import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface definitions based on API documentation
export interface StatusStatistic {
  status: string;
  statusText: string;
  count: number;
  color: string;
}

export interface ProductStatistic {
  productName: string;
  count: number;
  color: string;
}

export interface ApprovalRatio {
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  approvalRate: number;
  rejectionRate: number;
}

export interface ApprovedAmountByTime {
  date: string;
  totalApprovedAmount: number;
  applicationCount: number;
}

export interface DashboardSummary {
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  rejectionRate: number;
  statusBreakdown: StatusStatistic[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl + '/reports';

  constructor(private http: HttpClient) { }

  /**
   * Get Application Statistics by Status
   * Retrieves application count statistics grouped by status. Suitable for Bar chart visualization.
   * @returns Observable<ApiResponse<StatusStatistic[]>>
   */
  getApplicationsByStatus(): Observable<ApiResponse<StatusStatistic[]>> {
    return this.http.get<ApiResponse<StatusStatistic[]>>(`${this.apiUrl}/applications/by-status`);
  }

  /**
   * Get Application Statistics by Product
   * Retrieves application count statistics grouped by loan product. Suitable for Bar chart visualization.
   * @returns Observable<ApiResponse<ProductStatistic[]>>
   */
  getApplicationsByProduct(): Observable<ApiResponse<ProductStatistic[]>> {
    return this.http.get<ApiResponse<ProductStatistic[]>>(`${this.apiUrl}/applications/by-product`);
  }

  /**
   * Get Approval Ratio Statistics
   * Retrieves approval and rejection ratio statistics. Suitable for Pie chart visualization.
   * @returns Observable<ApiResponse<ApprovalRatio>>
   */
  getApprovalRatio(): Observable<ApiResponse<ApprovalRatio>> {
    return this.http.get<ApiResponse<ApprovalRatio>>(`${this.apiUrl}/applications/approval-ratio`);
  }

  /**
   * Get Approved Amount by Time
   * Retrieves total approved loan amounts over a specified time period. Suitable for Line chart visualization.
   * @param startDate Start date in ISO date format (YYYY-MM-DD)
   * @param endDate End date in ISO date format (YYYY-MM-DD)
   * @returns Observable<ApiResponse<ApprovedAmountByTime[]>>
   */
  getApprovedAmountByTime(startDate: string, endDate: string): Observable<ApiResponse<ApprovedAmountByTime[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ApiResponse<ApprovedAmountByTime[]>>(`${this.apiUrl}/applications/approved-amount-by-time`, { params });
  }

  /**
   * Get Dashboard Summary
   * Retrieves comprehensive summary statistics for administrative dashboard overview.
   * @returns Observable<ApiResponse<DashboardSummary>>
   */
  getDashboardSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/dashboard/summary`);
  }

  // Utility methods for date formatting and validation

  /**
   * Format Date to ISO string (YYYY-MM-DD)
   * @param date Date object to format
   * @returns Formatted date string
   */
  formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date range for common periods
   * @param period 'today' | 'week' | 'month' | 'quarter' | 'year'
   * @returns Object with startDate and endDate
   */
  getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
    const today = new Date();
    const endDate = this.formatDateToISO(today);
    let startDate: string;

    switch (period) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        startDate = this.formatDateToISO(weekStart);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = this.formatDateToISO(monthStart);
        break;
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        startDate = this.formatDateToISO(quarterStart);
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = this.formatDateToISO(yearStart);
        break;
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  }

  /**
   * Validate date range
   * @param startDate Start date string
   * @param endDate End date string
   * @returns true if valid, false otherwise
   */
  validateDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Check if start date is not after end date
    return start <= end;
  }

  /**
   * Get chart colors based on theme
   * @returns Array of color codes matching project theme
   */
  getChartColors(): string[] {
    return [
      '#E74C3C', // Primary red
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899'  // Pink
    ];
  }

  /**
   * Process chart data for different chart types
   * @param data Raw data from API
   * @param chartType 'bar' | 'pie' | 'line'
   * @returns Processed data for chart libraries
   */
  processChartData(data: any, chartType: 'bar' | 'pie' | 'line'): any {
    switch (chartType) {
      case 'bar':
        if (Array.isArray(data)) {
          return {
            labels: data.map(item => item.statusText || item.productName),
            datasets: [{
              data: data.map(item => item.count),
              backgroundColor: data.map(item => item.color),
              borderColor: data.map(item => item.color),
              borderWidth: 1
            }]
          };
        }
        break;
      case 'pie':
        if (data.approvalRate !== undefined) {
          return {
            labels: ['Đã duyệt', 'Từ chối'],
            datasets: [{
              data: [data.approvalRate, data.rejectionRate],
              backgroundColor: ['#10B981', '#EF4444'],
              borderColor: ['#10B981', '#EF4444'],
              borderWidth: 1
            }]
          };
        }
        break;
      case 'line':
        if (Array.isArray(data)) {
          return {
            labels: data.map(item => item.date),
            datasets: [{
              label: 'Số tiền đã duyệt',
              data: data.map(item => item.totalApprovedAmount),
              borderColor: '#E74C3C',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              tension: 0.4
            }]
          };
        }
        break;
    }
    return data;
  }
}

/*
 * REPORT SERVICE USAGE EXAMPLES:
 * 
 * 1. Basic Usage in Component:
 * ```typescript
 * constructor(private reportService: ReportService) {}
 * 
 * // Get status statistics for bar chart
 * this.reportService.getApplicationsByStatus().subscribe({
 *   next: (response) => {
 *     if (response.code === 1000) {
 *       this.statusData = response.data;
 *       this.chartData = this.reportService.processChartData(this.statusData, 'bar');
 *     }
 *   },
 *   error: (error) => console.error('Error:', error)
 * });
 * 
 * // Get date range for current month
 * const { startDate, endDate } = this.reportService.getDateRange('month');
 * this.reportService.getApprovedAmountByTime(startDate, endDate).subscribe(response => {
 *   // Handle response
 * });
 * ```
 * 
 * 2. Chart Integration:
 * ```typescript
 * // For Chart.js or similar libraries
 * this.reportService.getApplicationsByProduct().subscribe(response => {
 *   const chartConfig = {
 *     type: 'bar',
 *     data: this.reportService.processChartData(response.data, 'bar'),
 *     options: {
 *       responsive: true,
 *       plugins: {
 *         title: { display: true, text: 'Applications by Product' }
 *       }
 *     }
 *   };
 * });
 * ```
 * 
 * 3. Dashboard Summary:
 * ```typescript
 * ngOnInit() {
 *   this.loadDashboardData();
 * }
 * 
 * loadDashboardData() {
 *   this.reportService.getDashboardSummary().subscribe(response => {
 *     this.summary = response.data;
 *     this.setupCharts();
 *   });
 * }
 * ```
 * 
 * 4. Date Validation:
 * ```typescript
 * onDateRangeChange(start: string, end: string) {
 *   if (this.reportService.validateDateRange(start, end)) {
 *     this.loadTimeBasedReport(start, end);
 *   } else {
 *     this.showError('Invalid date range');
 *   }
 * }
 * ```
 * 
 * 5. Error Handling:
 * ```typescript
 * this.reportService.getApprovalRatio().subscribe({
 *   next: (response) => {
 *     if (response.code === 1000) {
 *       this.approvalData = response.data;
 *     } else {
 *       this.handleApiError(response.message);
 *     }
 *   },
 *   error: (error) => {
 *     if (error.status === 403) {
 *       this.router.navigate(['/unauthorized']);
 *     } else {
 *       this.showError('Failed to load approval statistics');
 *     }
 *   }
 * });
 * ```
 */
