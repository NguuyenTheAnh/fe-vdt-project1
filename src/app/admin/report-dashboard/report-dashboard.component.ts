import { Component, OnInit } from '@angular/core';
import {
  ReportService,
  StatusStatistic,
  ProductStatistic,
  ApprovalRatio,
  ApprovedAmountByTime,
  DashboardSummary
} from '../../services/report.service';

@Component({
  selector: 'app-report-dashboard',
  templateUrl: './report-dashboard.component.html',
  styleUrls: ['./report-dashboard.component.css']
})
export class ReportDashboardComponent implements OnInit {
  // Loading states
  isLoading = true;
  isStatusLoading = false;
  isProductLoading = false;
  isApprovalLoading = false;
  isTimeLoading = false;
  isDashboardLoading = false;

  // Error states
  error: string | null = null;
  statusError: string | null = null;
  productError: string | null = null;
  approvalError: string | null = null;
  timeError: string | null = null;
  dashboardError: string | null = null;

  // Data
  statusStatistics: StatusStatistic[] = [];
  productStatistics: ProductStatistic[] = [];
  approvalRatio: ApprovalRatio | null = null;
  timeData: ApprovedAmountByTime[] = [];
  dashboardSummary: DashboardSummary | null = null;

  // Chart data (processed for visualization)
  statusChartData: any = null;
  productChartData: any = null;
  approvalChartData: any = null;
  timeChartData: any = null;

  // Date range for time-based chart
  startDate: string = '';
  endDate: string = '';
  selectedPeriod: string = 'month';

  // Chart colors from theme
  chartColors: string[] = [];

  constructor(private reportService: ReportService) {
    this.chartColors = this.reportService.getChartColors();

    // Set default date range to current month
    const dateRange = this.reportService.getDateRange('month');
    this.startDate = dateRange.startDate;
    this.endDate = dateRange.endDate;
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  /**
   * Load all dashboard data
   */
  loadAllData(): void {
    this.isLoading = true;
    this.error = null;

    // Load all data in parallel
    Promise.all([
      this.loadDashboardSummary(),
      this.loadStatusStatistics(),
      this.loadProductStatistics(),
      this.loadApprovalRatio(),
      this.loadTimeData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  /**
   * Load dashboard summary
   */
  async loadDashboardSummary(): Promise<void> {
    this.isDashboardLoading = true;
    this.dashboardError = null;

    try {
      const response = await this.reportService.getDashboardSummary().toPromise();
      if (response && response.code === 1000) {
        this.dashboardSummary = response.data;
      } else {
        this.dashboardError = 'Không thể tải tổng quan dashboard';
      }
    } catch (error) {
      console.error('Error loading dashboard summary:', error);
      this.dashboardError = 'Lỗi kết nối khi tải dữ liệu tổng quan';
    } finally {
      this.isDashboardLoading = false;
    }
  }

  /**
   * Load status statistics
   */
  async loadStatusStatistics(): Promise<void> {
    this.isStatusLoading = true;
    this.statusError = null;

    try {
      const response = await this.reportService.getApplicationsByStatus().toPromise();
      if (response && response.code === 1000) {
        this.statusStatistics = response.data;
        this.statusChartData = this.reportService.processChartData(response.data, 'bar');
      } else {
        this.statusError = 'Không thể tải thống kê theo trạng thái';
      }
    } catch (error) {
      console.error('Error loading status statistics:', error);
      this.statusError = 'Lỗi kết nối khi tải thống kê trạng thái';
    } finally {
      this.isStatusLoading = false;
    }
  }

  /**
   * Load product statistics
   */
  async loadProductStatistics(): Promise<void> {
    this.isProductLoading = true;
    this.productError = null;

    try {
      const response = await this.reportService.getApplicationsByProduct().toPromise();
      if (response && response.code === 1000) {
        this.productStatistics = response.data;
        this.productChartData = this.reportService.processChartData(response.data, 'bar');
      } else {
        this.productError = 'Không thể tải thống kê theo sản phẩm';
      }
    } catch (error) {
      console.error('Error loading product statistics:', error);
      this.productError = 'Lỗi kết nối khi tải thống kê sản phẩm';
    } finally {
      this.isProductLoading = false;
    }
  }

  /**
   * Load approval ratio
   */
  async loadApprovalRatio(): Promise<void> {
    this.isApprovalLoading = true;
    this.approvalError = null;

    try {
      const response = await this.reportService.getApprovalRatio().toPromise();
      if (response && response.code === 1000) {
        this.approvalRatio = response.data;
        this.approvalChartData = this.reportService.processChartData(response.data, 'pie');
      } else {
        this.approvalError = 'Không thể tải tỷ lệ duyệt/từ chối';
      }
    } catch (error) {
      console.error('Error loading approval ratio:', error);
      this.approvalError = 'Lỗi kết nối khi tải tỷ lệ duyệt';
    } finally {
      this.isApprovalLoading = false;
    }
  }

  /**
   * Load time-based data
   */
  async loadTimeData(): Promise<void> {
    this.isTimeLoading = true;
    this.timeError = null;

    try {
      if (!this.reportService.validateDateRange(this.startDate, this.endDate)) {
        this.timeError = 'Khoảng thời gian không hợp lệ';
        return;
      }

      const response = await this.reportService.getApprovedAmountByTime(this.startDate, this.endDate).toPromise();
      if (response && response.code === 1000) {
        this.timeData = response.data;
        this.timeChartData = this.reportService.processChartData(response.data, 'line');
      } else {
        this.timeError = 'Không thể tải dữ liệu theo thời gian';
      }
    } catch (error) {
      console.error('Error loading time data:', error);
      this.timeError = 'Lỗi kết nối khi tải dữ liệu thời gian';
    } finally {
      this.isTimeLoading = false;
    }
  }

  /**
   * Handle period change
   */
  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    const dateRange = this.reportService.getDateRange(period as any);
    this.startDate = dateRange.startDate;
    this.endDate = dateRange.endDate;
    this.loadTimeData();
  }

  /**
   * Handle custom date range change
   */
  onDateRangeChange(): void {
    if (this.reportService.validateDateRange(this.startDate, this.endDate)) {
      this.selectedPeriod = 'custom';
      this.loadTimeData();
    } else {
      this.timeError = 'Ngày bắt đầu không thể sau ngày kết thúc';
    }
  }

  /**
   * Refresh specific section
   */
  refreshSection(section: string): void {
    switch (section) {
      case 'dashboard':
        this.loadDashboardSummary();
        break;
      case 'status':
        this.loadStatusStatistics();
        break;
      case 'product':
        this.loadProductStatistics();
        break;
      case 'approval':
        this.loadApprovalRatio();
        break;
      case 'time':
        this.loadTimeData();
        break;
      case 'all':
        this.loadAllData();
        break;
    }
  }

  /**
   * Get last update time for header status
   */
  getLastUpdateTime(): string {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `lúc ${timeStr}`;
  }

  /**
   * Get day of week in Vietnamese
   */
  getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  }

  /**
   * Get progress percentage for visual representation
   */
  getProgressPercentage(amount: number): number {
    const maxAmount = this.getMaxTimeAmount();
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }

  /**
   * Get average amount per day
   */
  getAverageAmount(): number {
    if (this.timeData.length === 0) return 0;
    const total = this.timeData.reduce((sum, item) => sum + item.totalApprovedAmount, 0);
    return total / this.timeData.length;
  }

  /**
   * Enhanced format currency with better display
   */
  formatCurrency(amount: number): string {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + ' tỷ VND';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' tr VND';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'k VND';
    }
    return amount.toLocaleString('vi-VN') + ' VND';
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  /**
   * Get total approved amount from time data
   */
  getTotalApprovedAmount(): number {
    return this.timeData.reduce((total, item) => total + item.totalApprovedAmount, 0);
  }

  /**
   * Get total applications from time data
   */
  getTotalApplicationsFromTime(): number {
    return this.timeData.reduce((total, item) => total + item.applicationCount, 0);
  }

  /**
   * Get max status count for chart scaling
   */
  getMaxStatusCount(): number {
    return Math.max(...this.statusStatistics.map(s => s.count), 1);
  }

  /**
   * Get max product count for chart scaling
   */
  getMaxProductCount(): number {
    return Math.max(...this.productStatistics.map(s => s.count), 1);
  }

  /**
   * Get max time amount for chart scaling
   */
  getMaxTimeAmount(): number {
    return Math.max(...this.timeData.map(s => s.totalApprovedAmount), 1);
  }

  // Export functionality
  async exportReport(): Promise<void> {
    try {
      const reportData = {
        summary: this.dashboardSummary,
        statusStatistics: this.statusStatistics,
        productStatistics: this.productStatistics,
        approvalRatio: this.approvalRatio,
        timeData: this.timeData,
        exportDate: new Date().toISOString(),
        dateRange: {
          startDate: this.startDate,
          endDate: this.endDate,
          period: this.selectedPeriod
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-thong-ke-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      this.error = 'Không thể xuất báo cáo. Vui lòng thử lại.';
    }
  }
}
