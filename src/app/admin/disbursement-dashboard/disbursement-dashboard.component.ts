import { Component, OnInit } from '@angular/core';
import { DisbursementService, DisbursementResponse, PagedDisbursementResponse, DisbursementSummaryResponse, CreateDisbursementRequest, GetDisbursementsParams } from '../../services/disbursement.service';
import { ApplicationService, LoanApplicationResponse, LoanApplicationStatus } from '../../services/application.service';

@Component({
  selector: 'app-disbursement-dashboard',
  templateUrl: './disbursement-dashboard.component.html',
  styleUrls: ['./disbursement-dashboard.component.css']
})
export class DisbursementDashboardComponent implements OnInit {
  // Data properties
  disbursements: DisbursementResponse[] = [];
  approvedApplications: LoanApplicationResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  // Loading and error states
  isLoading = false;
  isLoadingApplications = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  sortBy = 'transactionDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedApplicationId: number | null = null;

  // Sort options
  sortOptions = [
    { value: 'transactionDate', label: 'Ngày giao dịch' },
    { value: 'amount', label: 'Số tiền' },
    { value: 'applicationId', label: 'Mã đơn vay' }
  ];

  // Page size options
  pageSizeOptions = [5, 10, 20, 50];

  // Modal properties
  isCreateModalOpen = false;
  isViewModalOpen = false;
  selectedDisbursement: DisbursementResponse | null = null;
  selectedApplication: LoanApplicationResponse | null = null;
  disbursementSummary: DisbursementSummaryResponse | null = null;

  // Create disbursement form
  createForm: CreateDisbursementRequest = {
    applicationId: 0,
    amount: 0,
    notes: ''
  };
  isCreating = false;

  // Statistics
  totalDisbursedToday = 0;
  totalDisbursedThisMonth = 0;
  pendingDisbursements = 0;

  constructor(
    private disbursementService: DisbursementService,
    private applicationService: ApplicationService
  ) { }

  ngOnInit(): void {
    this.loadDisbursements();
    this.loadApprovedApplications();
    this.loadStatistics();
  }

  // Load disbursements with pagination
  loadDisbursements(): void {
    this.isLoading = true;
    this.error = null;

    const params: GetDisbursementsParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: `${this.sortBy},${this.sortDirection}`
    };

    this.disbursementService.getAllDisbursements(params).subscribe({
      next: (response) => {
        if (response) {
          this.disbursements = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          // Recalculate statistics after loading disbursements
          this.loadStatistics();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách giải ngân. Vui lòng thử lại.';
        this.isLoading = false;
        console.error('Error loading disbursements:', error);
      }
    });
  }

  // Load approved applications for disbursement
  loadApprovedApplications(): void {
    this.isLoadingApplications = true;

    this.applicationService.getAllLoanApplications({ page: 0, size: 100 }).subscribe({
      next: (response) => {
        if (response) {
          this.approvedApplications = response.content.filter(app =>
            app.status === LoanApplicationStatus.APPROVED ||
            app.status === LoanApplicationStatus.PARTIALLY_DISBURSED
          );
          // Recalculate statistics after loading applications
          this.loadStatistics();
        }
        this.isLoadingApplications = false;
      },
      error: (error) => {
        this.isLoadingApplications = false;
        console.error('Error loading approved applications:', error);
      }
    });
  }

  // Load statistics
  loadStatistics(): void {
    // Calculate today's disbursements
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    this.totalDisbursedToday = this.disbursements
      .filter(d => d.transactionDate.startsWith(todayStr))
      .reduce((sum, d) => sum + d.amount, 0);

    // Calculate this month's disbursements
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    this.totalDisbursedThisMonth = this.disbursements
      .filter(d => {
        const disbursementDate = new Date(d.transactionDate);
        return disbursementDate.getMonth() === currentMonth &&
          disbursementDate.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + d.amount, 0);

    // Count pending disbursements (approved applications not fully disbursed)
    this.pendingDisbursements = this.approvedApplications.filter(app =>
      app.status === LoanApplicationStatus.APPROVED
    ).length;
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 0;
    this.loadDisbursements();
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.selectedApplicationId = null;
    this.currentPage = 0;
    this.loadDisbursements();
  }

  // Sort functionality
  onSortChange(): void {
    this.currentPage = 0;
    this.loadDisbursements();
  }

  // Change sort direction
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  // Pagination
  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDisbursements();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadDisbursements();
  }

  // Modal functionality
  openCreateModal(): void {
    this.createForm = {
      applicationId: 0,
      amount: 0,
      notes: ''
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.createForm = {
      applicationId: 0,
      amount: 0,
      notes: ''
    };
  }

  openViewModal(disbursement: DisbursementResponse): void {
    this.selectedDisbursement = disbursement;
    this.isViewModalOpen = true;
    this.loadDisbursementSummary(disbursement.applicationId);
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedDisbursement = null;
    this.disbursementSummary = null;
  }

  // Load disbursement summary
  loadDisbursementSummary(applicationId: number): void {
    this.disbursementService.getDisbursementSummary(applicationId).subscribe({
      next: (summary) => {
        this.disbursementSummary = summary;
      },
      error: (error) => {
        console.error('Error loading disbursement summary:', error);
      }
    });
  }

  // Create disbursement
  createDisbursement(): void {
    if (!this.createForm.applicationId || !this.createForm.amount) {
      this.error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
      return;
    }

    this.isCreating = true;
    this.error = null;

    this.disbursementService.createDisbursement(this.createForm).subscribe({
      next: (response) => {
        if (response) {
          this.closeCreateModal();
          this.loadDisbursements();
          this.loadApprovedApplications();
          this.error = null;
        }
        this.isCreating = false;
      },
      error: (error) => {
        this.error = 'Không thể tạo giao dịch giải ngân. Vui lòng thử lại.';
        this.isCreating = false;
        console.error('Error creating disbursement:', error);
      }
    });
  }

  // Delete disbursement
  deleteDisbursement(transactionId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      this.disbursementService.deleteDisbursement(transactionId).subscribe({
        next: (success) => {
          if (success) {
            this.loadDisbursements();
            this.loadApprovedApplications();
          }
        },
        error: (error) => {
          this.error = 'Không thể xóa giao dịch. Vui lòng thử lại.';
          console.error('Error deleting disbursement:', error);
        }
      });
    }
  }

  // Helper methods
  formatCurrency(amount: number): string {
    return this.disbursementService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return this.disbursementService.formatDate(dateString);
  }

  formatTransactionDate(dateString: string): string {
    return this.disbursementService.formatTransactionDate(dateString);
  }

  calculateProgress(disbursedAmount: number, totalAmount: number): number {
    return this.disbursementService.calculateProgress(disbursedAmount, totalAmount);
  }

  getProgressColorClass(progress: number): string {
    return this.disbursementService.getProgressColorClass(progress);
  }

  getDisbursementStatusLabel(isFullyDisbursed: boolean): string {
    return this.disbursementService.getDisbursementStatusLabel(isFullyDisbursed);
  }

  getDisbursementStatusColorClass(isFullyDisbursed: boolean): string {
    return this.disbursementService.getDisbursementStatusColorClass(isFullyDisbursed);
  }

  // Get pagination array for display
  getPaginationArray(): number[] {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Get end index for pagination display
  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  // Refresh data
  refreshData(): void {
    this.loadDisbursements();
    this.loadApprovedApplications();
    this.loadStatistics();
  }

  // Export functionality
  exportDisbursements(): void {
    console.log('Export functionality to be implemented');
  }
}
