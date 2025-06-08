import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoanService, LoanApplication, PageableResponse } from '../../services/loan.service';
import { ApiResponse } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css', './modal-fix.css']
})
export class ApplicationListComponent implements OnInit {
  applications: LoanApplication[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 4;
  totalPages: number = 0;
  totalElements: number = 0;

  // Add Math property for template use
  Math = Math;

  // For displaying loan status
  statusTranslations: { [key: string]: string } = {
    'NEW': 'Mới',
    'UNDER_REVIEW': 'Đang xem xét',
    'APPROVED': 'Đã duyệt',
    'REJECTED': 'Từ chối',
    'CANCELLED': 'Đã hủy',
    'PARTIALLY_DISBURSED': 'Giải ngân một phần',
    'FULLY_DISBURSED': 'Đã giải ngân hoàn tất'
  };

  // For formatting values
  formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  });

  constructor(
    private loanService: LoanService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.error = null;

    // Create a timer to ensure loading state is displayed for at least 1 second
    const minLoadingTime = 500; // 0.5 second
    const loadingStartTime = Date.now();

    this.loanService.getUserApplications(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        // Calculate how long we've been loading so far
        const loadingElapsedTime = Date.now() - loadingStartTime;
        const remainingDelay = Math.max(0, minLoadingTime - loadingElapsedTime);

        // If the API responded too quickly, add artificial delay to show loading message
        setTimeout(() => {
          if (response && response.data) {
            this.applications = response.data.content;

            // Update pagination info
            this.totalPages = response.data.totalPages;
            this.totalElements = response.data.totalElements;
          } else {
            console.error('No data received from applications API');
            this.error = 'Không nhận được dữ liệu từ hệ thống.';
          }
          this.isLoading = false;
        }, remainingDelay);
      },
      error: (error) => {
        console.error('Error loading applications', error);
        this.error = 'Không thể tải danh sách hồ sơ vay. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Format amount to Vietnamese currency
   */
  formatAmount(amount: number): string {
    return this.formatter.format(amount);
  }

  /**
   * Convert status code to Vietnamese
   */
  getStatusDisplay(status: string): string {
    return this.statusTranslations[status] || status;
  }

  /**
   * Get CSS class for application status
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'DISBURSED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format date to Vietnamese format
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Change page and reload applications
   */
  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadApplications();
  }

  /**
   * Check if there are previous pages
   */
  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Check if there are next pages
   */
  hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  /**
   * Tạo mảng các số trang hiển thị cho pagination kiểu "< 1 2 3 >"
   */
  getPaginationRange(): (number | string)[] {
    const result: (number | string)[] = [];

    // Guard clause - nếu không có trang nào thì trả về mảng trống
    if (!this.totalPages || this.totalPages <= 0) {
      return [];
    }

    const currentPage = this.currentPage + 1; // Convert to 1-based for display
    const totalPages = this.totalPages;

    // Nếu chỉ có 1 trang, chỉ hiện trang đó
    if (totalPages === 1) {
      result.push(1);
      return result;
    }

    // Luôn hiển thị trang đầu tiên
    result.push(1);

    // Hiển thị "..." nếu trang hiện tại > 3
    if (currentPage > 3) {
      result.push('...');
    }

    // Hiển thị các trang xung quanh trang hiện tại
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      // Tránh hiển thị trùng với trang đầu tiên hoặc trang cuối
      if (i !== 1 && i !== totalPages) {
        result.push(i);
      }
    }

    // Hiển thị "..." nếu trang hiện tại < totalPages - 2
    if (currentPage < totalPages - 2) {
      result.push('...');
    }

    // Luôn hiển thị trang cuối cùng nếu có nhiều hơn 1 trang
    if (totalPages > 1) {
      result.push(totalPages);
    }

    return result;
  }

  /**
   * Get array of page numbers for pagination
   * Returns an array of page numbers to show in pagination
   */
  getPagesArray(): number[] {
    const totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i);

    // If less than 7 pages, show all
    if (this.totalPages <= 5) {
      return totalPagesArray;
    }

    // For more than 7 pages, we need to show current page with 1 or 2 pages around it
    let startPage = Math.max(0, this.currentPage - 1);
    let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);

    // Adjust the range to always show 3 pages if possible
    if (endPage - startPage + 1 < 3) {
      if (startPage === 0) {
        endPage = Math.min(this.totalPages - 1, 2);
      } else if (endPage === this.totalPages - 1) {
        startPage = Math.max(0, this.totalPages - 3);
      }
    }

    return totalPagesArray.slice(startPage, endPage + 1);
  }

  /**
   * Navigate to application detail page
   * @param applicationId Application ID to view
   */
  viewApplicationDetail(applicationId: number | undefined): void {
    if (applicationId) {
      this.router.navigate(['/borrower-portal/application-list', applicationId]);
    }
  }

  /**
   * Go to a specific page
   */
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadApplications();
  }

  /**
   * View application detail
   */
}
