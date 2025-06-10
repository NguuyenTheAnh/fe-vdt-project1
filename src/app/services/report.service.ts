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

export interface DisbursedAmountByTime {
  date: string;
  totalDisbursedAmount: number;
  disbursedCount: number;
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
   * Get Disbursed Amount by Time
   * Retrieves total disbursed loan amounts and transaction count over a specified time period. 
   * Suitable for Line chart visualization to track disbursement trends.
   * @param startDate Start date in ISO date format (YYYY-MM-DD)
   * @param endDate End date in ISO date format (YYYY-MM-DD)
   * @returns Observable<ApiResponse<DisbursedAmountByTime[]>>
   */
  getDisbursedAmountByTime(startDate: string, endDate: string): Observable<ApiResponse<DisbursedAmountByTime[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ApiResponse<DisbursedAmountByTime[]>>(`${this.apiUrl}/applications/disbursed-amount-by-time`, { params });
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
   * @param chartType 'bar' | 'pie' | 'line' | 'multiline'
   * @param dataType Optional: 'approved' | 'disbursed' for line charts
   * @returns Processed data for chart libraries
   */
  processChartData(data: any, chartType: 'bar' | 'pie' | 'line' | 'multiline', dataType?: 'approved' | 'disbursed'): any {
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
          // Handle approved amount data
          if (dataType === 'approved' || data[0]?.totalApprovedAmount !== undefined) {
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
          // Handle disbursed amount data
          else if (dataType === 'disbursed' || data[0]?.totalDisbursedAmount !== undefined) {
            return {
              labels: data.map(item => item.date),
              datasets: [{
                label: 'Số tiền đã giải ngân',
                data: data.map(item => item.totalDisbursedAmount),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
              }]
            };
          }
        }
        break;
      case 'multiline':
        // For comparing approved vs disbursed amounts
        if (Array.isArray(data) && data.length === 2) {
          const [approvedData, disbursedData] = data as [ApprovedAmountByTime[], DisbursedAmountByTime[]];
          return {
            labels: approvedData.map((item: ApprovedAmountByTime) => item.date),
            datasets: [
              {
                label: 'Số tiền đã duyệt',
                data: approvedData.map((item: ApprovedAmountByTime) => item.totalApprovedAmount || 0),
                borderColor: '#E74C3C',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4
              },
              {
                label: 'Số tiền đã giải ngân',
                data: disbursedData.map((item: DisbursedAmountByTime) => item.totalDisbursedAmount || 0),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
              }
            ]
          };
        }
        break;
    }
    return data;
  }

  /**
   * Calculate disbursement statistics from time-based data
   * @param data Array of DisbursedAmountByTime
   * @returns Summary statistics
   */
  calculateDisbursementStats(data: DisbursedAmountByTime[]): {
    totalDisbursed: number;
    totalTransactions: number;
    averageDaily: number;
    peakDay: DisbursedAmountByTime | null;
  } {
    if (!data || data.length === 0) {
      return { totalDisbursed: 0, totalTransactions: 0, averageDaily: 0, peakDay: null };
    }

    const totalDisbursed = data.reduce((sum, day) => sum + day.totalDisbursedAmount, 0);
    const totalTransactions = data.reduce((sum, day) => sum + day.disbursedCount, 0);
    const averageDaily = totalDisbursed / data.length;
    const peakDay = data.reduce((max, day) =>
      day.totalDisbursedAmount > max.totalDisbursedAmount ? day : max
    );

    return { totalDisbursed, totalTransactions, averageDaily, peakDay };
  }

  /**
   * Compare approved vs disbursed amounts
   * @param approvedData Array of ApprovedAmountByTime
   * @param disbursedData Array of DisbursedAmountByTime
   * @returns Comparison statistics
   */
  compareApprovedVsDisbursed(
    approvedData: ApprovedAmountByTime[],
    disbursedData: DisbursedAmountByTime[]
  ): {
    totalApproved: number;
    totalDisbursed: number;
    disbursementRatio: number;
    dailyComparison: Array<{
      date: string;
      approved: number;
      disbursed: number;
      ratio: number;
    }>;
  } {
    const totalApproved = approvedData.reduce((sum, day) => sum + day.totalApprovedAmount, 0);
    const totalDisbursed = disbursedData.reduce((sum, day) => sum + day.totalDisbursedAmount, 0);
    const disbursementRatio = totalApproved > 0 ? (totalDisbursed / totalApproved) * 100 : 0;

    // Create a map for quick lookup
    const disbursedMap = new Map<string, number>();
    disbursedData.forEach(item => disbursedMap.set(item.date, item.totalDisbursedAmount));

    const dailyComparison = approvedData.map(approvedItem => {
      const disbursed = disbursedMap.get(approvedItem.date) || 0;
      const ratio = approvedItem.totalApprovedAmount > 0 ?
        (disbursed / approvedItem.totalApprovedAmount) * 100 : 0;

      return {
        date: approvedItem.date,
        approved: approvedItem.totalApprovedAmount,
        disbursed,
        ratio
      };
    });

    return { totalApproved, totalDisbursed, disbursementRatio, dailyComparison };
  }

  /**
   * Format currency value for display
   * @param amount Amount in VND
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Calculate growth rate between two periods
   * @param previousPeriod Previous period total
   * @param currentPeriod Current period total
   * @returns Growth rate percentage
   */
  calculateGrowthRate(previousPeriod: number, currentPeriod: number): number {
    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  /**
   * Get date ranges for comparison analysis
   * @param period 'week' | 'month' | 'quarter' | 'year'
   * @returns Current and previous period date ranges
   */
  getComparisonDateRanges(period: 'week' | 'month' | 'quarter' | 'year'): {
    current: { startDate: string; endDate: string };
    previous: { startDate: string; endDate: string };
  } {
    const today = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case 'week':
        currentEnd = new Date(today);
        currentStart = new Date(today);
        currentStart.setDate(today.getDate() - 6);

        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousEnd.getDate() - 6);
        break;

      case 'month':
        currentEnd = new Date(today);
        currentStart = new Date(today.getFullYear(), today.getMonth(), 1);

        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
        break;

      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        currentStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
        currentEnd = new Date(today);

        const previousQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const previousYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        previousStart = new Date(previousYear, previousQuarter * 3, 1);
        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;

      case 'year':
        currentStart = new Date(today.getFullYear(), 0, 1);
        currentEnd = new Date(today);

        previousStart = new Date(today.getFullYear() - 1, 0, 1);
        previousEnd = new Date(today.getFullYear() - 1, 11, 31);
        break;

      default:
        currentStart = currentEnd = previousStart = previousEnd = new Date(today);
    }

    return {
      current: {
        startDate: this.formatDateToISO(currentStart),
        endDate: this.formatDateToISO(currentEnd)
      },
      previous: {
        startDate: this.formatDateToISO(previousStart),
        endDate: this.formatDateToISO(previousEnd)
      }
    };
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
 * // Get disbursed amount by time
 * const { startDate, endDate } = this.reportService.getDateRange('month');
 * this.reportService.getDisbursedAmountByTime(startDate, endDate).subscribe(response => {
 *   if (response.code === 1000) {
 *     this.disbursedData = response.data;
 *     this.disbursedStats = this.reportService.calculateDisbursementStats(this.disbursedData);
 *     this.chartData = this.reportService.processChartData(this.disbursedData, 'line', 'disbursed');
 *   }
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
 * 
 * // Disbursed amount line chart
 * this.reportService.getDisbursedAmountByTime('2024-01-01', '2024-01-31').subscribe(response => {
 *   const chartConfig = {
 *     type: 'line',
 *     data: this.reportService.processChartData(response.data, 'line', 'disbursed'),
 *     options: {
 *       responsive: true,
 *       scales: {
 *         y: {
 *           beginAtZero: true,
 *           ticks: {
 *             callback: (value) => this.reportService.formatCurrency(Number(value))
 *           }
 *         }
 *       }
 *     }
 *   };
 * });
 * ```
 * 
 * 3. Dashboard Summary with Disbursement Analytics:
 * ```typescript
 * ngOnInit() {
 *   this.loadDashboardData();
 *   this.loadDisbursementAnalytics();
 * }
 * 
 * loadDashboardData() {
 *   this.reportService.getDashboardSummary().subscribe(response => {
 *     this.summary = response.data;
 *     this.setupCharts();
 *   });
 * }
 * 
 * async loadDisbursementAnalytics() {
 *   const { current, previous } = this.reportService.getComparisonDateRanges('month');
 *   
 *   const [currentData, previousData] = await Promise.all([
 *     this.reportService.getDisbursedAmountByTime(current.startDate, current.endDate).toPromise(),
 *     this.reportService.getDisbursedAmountByTime(previous.startDate, previous.endDate).toPromise()
 *   ]);
 * 
 *   if (currentData?.code === 1000 && previousData?.code === 1000) {
 *     const currentStats = this.reportService.calculateDisbursementStats(currentData.data);
 *     const previousStats = this.reportService.calculateDisbursementStats(previousData.data);
 *     
 *     this.growthRate = this.reportService.calculateGrowthRate(
 *       previousStats.totalDisbursed,
 *       currentStats.totalDisbursed
 *     );
 *   }
 * }
 * ```
 * 
 * 4. Approved vs Disbursed Comparison:
 * ```typescript
 * async compareApprovedVsDisbursed(startDate: string, endDate: string) {
 *   const [approvedResponse, disbursedResponse] = await Promise.all([
 *     this.reportService.getApprovedAmountByTime(startDate, endDate).toPromise(),
 *     this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise()
 *   ]);
 *   
 *   if (approvedResponse?.code === 1000 && disbursedResponse?.code === 1000) {
 *     const comparison = this.reportService.compareApprovedVsDisbursed(
 *       approvedResponse.data,
 *       disbursedResponse.data
 *     );
 *     
 *     console.log(`Disbursement Ratio: ${comparison.disbursementRatio.toFixed(2)}%`);
 *     
 *     // Multi-line chart
 *     this.chartData = this.reportService.processChartData(
 *       [approvedResponse.data, disbursedResponse.data],
 *       'multiline'
 *     );
 *   }
 * }
 * ```
 * 
 * 5. Date Validation and Error Handling:
 * ```typescript
 * onDateRangeChange(start: string, end: string) {
 *   if (this.reportService.validateDateRange(start, end)) {
 *     this.loadDisbursedReport(start, end);
 *   } else {
 *     this.showError('Invalid date range');
 *   }
 * }
 * 
 * loadDisbursedReport(startDate: string, endDate: string) {
 *   this.reportService.getDisbursedAmountByTime(startDate, endDate).subscribe({
 *     next: (response) => {
 *       if (response.code === 1000) {
 *         this.disbursedData = response.data;
 *         this.stats = this.reportService.calculateDisbursementStats(this.disbursedData);
 *         
 *         // Format display values
 *         this.totalDisbursedFormatted = this.reportService.formatCurrency(this.stats.totalDisbursed);
 *         this.averageDailyFormatted = this.reportService.formatCurrency(this.stats.averageDaily);
 *       } else {
 *         this.handleApiError(response.message);
 *       }
 *     },
 *     error: (error) => {
 *       if (error.status === 403) {
 *         this.router.navigate(['/unauthorized']);
 *       } else {
 *         this.showError('Failed to load disbursement statistics');
 *       }
 *     }
 *   });
 * }
 * ```
 * 
 * 6. Real-time Dashboard Updates:
 * ```typescript
 * setupRealTimeUpdates() {
 *   // Update disbursement data every 5 minutes
 *   interval(300000).subscribe(() => {
 *     if (this.isVisible) {
 *       this.refreshDisbursementData();
 *     }
 *   });
 * }
 * 
 * refreshDisbursementData() {
 *   const today = this.reportService.formatDateToISO(new Date());
 *   this.reportService.getDisbursedAmountByTime(today, today).subscribe(response => {
 *     if (response.code === 1000) {
 *       this.todayDisbursement = response.data[0] || { 
 *         date: today, 
 *         totalDisbursedAmount: 0, 
 *         disbursedCount: 0 
 *       };
 *     }
 *   });
 * }
 * ```
 * 
 * 7. Export and Reporting:
 * ```typescript
 * async exportDisbursementReport(startDate: string, endDate: string) {
 *   const response = await this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise();
 *   
 *   if (response?.code === 1000) {
 *     const stats = this.reportService.calculateDisbursementStats(response.data);
 *     
 *     const exportData = {
 *       period: `${startDate} to ${endDate}`,
 *       summary: {
 *         totalDisbursed: this.reportService.formatCurrency(stats.totalDisbursed),
 *         totalTransactions: stats.totalTransactions,
 *         averageDaily: this.reportService.formatCurrency(stats.averageDaily),
 *         peakDay: stats.peakDay?.date,
 *         peakAmount: stats.peakDay ? this.reportService.formatCurrency(stats.peakDay.totalDisbursedAmount) : 'N/A'
 *       },
 *       dailyData: response.data.map(item => ({
 *         date: item.date,
 *         amount: this.reportService.formatCurrency(item.totalDisbursedAmount),
 *         transactions: item.disbursedCount
 *       }))
 *     };
 *     
 *     // Export to Excel or PDF
 *     this.exportService.exportToExcel(exportData, `disbursement-report-${startDate}-${endDate}.xlsx`);
 *   }
 * }
 * ```
 */
