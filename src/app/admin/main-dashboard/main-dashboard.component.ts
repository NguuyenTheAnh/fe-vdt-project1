import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService, DashboardSummary, ApiResponse } from '../../services/report.service';

// Interface for quick stats display
interface QuickStat {
  title: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
  bgColor: string;
  isLoading?: boolean;
}

@Component({
  selector: 'app-main-dashboard',
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.css']
})
export class MainDashboardComponent implements OnInit {

  constructor(
    private router: Router,
    private reportService: ReportService
  ) { }

  // Current date for display
  currentDate = new Date();

  // Loading states
  isLoading = false;
  dashboardError: string | null = null;

  // Dashboard data
  dashboardSummary: DashboardSummary | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Dashboard menu items with their routes, titles, descriptions, and icons
  dashboardItems = [
    {
      title: 'Vai trò',
      description: 'Quản lý vai trò và quyền hạn của người dùng trong hệ thống',
      route: '/admin/role-list',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Người dùng',
      description: 'Quản lý thông tin người dùng và tài khoản trong hệ thống',
      route: '/admin/user-list',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Sản phẩm vay',
      description: 'Quản lý các loại sản phẩm vay và điều kiện cho vay',
      route: '/admin/loan-product-list',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Đơn vay',
      description: 'Xem và xử lý các đơn xin vay từ khách hàng',
      route: '/admin/loan-application-list',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Giải ngân',
      description: 'Quản lý việc giải ngân và phát hành khoản vay',
      route: '/admin/disbursement',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Báo cáo',
      description: 'Xem các báo cáo thống kê và phân tích dữ liệu hệ thống',
      route: '/admin/report',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Cấu hình hệ thống',
      description: 'Cấu hình các thông số và tham số của hệ thống',
      route: '/admin/system-config',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  // Quick stats for the dashboard - will be populated with real data
  quickStats: QuickStat[] = [
    {
      title: 'Tổng đơn vay',
      value: '0',
      change: '',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isLoading: true
    },
    {
      title: 'Đơn vay đã duyệt',
      value: '0',
      change: '',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isLoading: true
    },
    {
      title: 'Đơn vay bị từ chối',
      value: '0',
      change: '',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      isLoading: true
    },
    {
      title: 'Tỷ lệ duyệt',
      value: '0%',
      change: '',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isLoading: true
    }
  ];

  // Navigate to specific route
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Load dashboard data from API
   */
  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.dashboardError = null;

    try {
      const response = await this.reportService.getDashboardSummary().toPromise();

      if (response && response.code === 1000) {
        this.dashboardSummary = response.data;
        this.updateQuickStats(response.data);
      } else {
        this.dashboardError = 'Không thể tải dữ liệu dashboard';
        this.setErrorState();
      }
    } catch (error: any) {
      this.dashboardError = 'Lỗi kết nối khi tải dữ liệu dashboard';
      this.setErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update quick stats with real data from API
   */
  private updateQuickStats(data: DashboardSummary): void {
    this.quickStats[0] = {
      ...this.quickStats[0],
      value: this.formatNumber(data.totalApplications),
      change: '',
      isLoading: false
    };

    this.quickStats[1] = {
      ...this.quickStats[1],
      value: this.formatNumber(data.approvedCount),
      change: `${data.approvalRate.toFixed(1)}%`,
      isLoading: false
    };

    this.quickStats[2] = {
      ...this.quickStats[2],
      value: this.formatNumber(data.rejectedCount),
      change: `${data.rejectionRate.toFixed(1)}%`,
      isLoading: false
    };

    this.quickStats[3] = {
      ...this.quickStats[3],
      value: `${data.approvalRate.toFixed(1)}%`,
      change: data.totalApplications > 0 ? `${data.approvedCount}/${data.totalApplications}` : '',
      isLoading: false
    };
  }

  /**
   * Set error state for quick stats
   */
  private setErrorState(): void {
    this.quickStats.forEach(stat => {
      stat.value = 'N/A';
      stat.change = '';
      stat.isLoading = false;
    });
  }

  /**
   * Format number with thousands separator
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
  }

  /**
   * Retry loading data
   */
  retryLoadData(): void {
    this.loadDashboardData();
  }
}
