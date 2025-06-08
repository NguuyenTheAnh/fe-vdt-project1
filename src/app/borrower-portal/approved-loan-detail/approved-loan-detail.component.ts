import { Component, OnInit } from '@angular/core';
import { ApplicationService, LoanApplicationResponse, LoanApplicationStatus } from '../../services/application.service';

@Component({
  selector: 'app-approved-loan-detail',
  templateUrl: './approved-loan-detail.component.html',
  styleUrls: ['./approved-loan-detail.component.css']
})
export class ApprovedLoanDetailComponent implements OnInit {
  // Data properties
  approvedLoans: LoanApplicationResponse[] = [];
  selectedLoan: LoanApplicationResponse | null = null;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 6;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  // Modal state
  isDetailModalOpen = false;

  // Filter properties
  statusFilter: LoanApplicationStatus | 'ALL' = 'ALL';
  sortBy = 'updatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Status options for filtering
  statusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: LoanApplicationStatus.APPROVED, label: 'Đã duyệt' },
    { value: LoanApplicationStatus.PARTIALLY_DISBURSED, label: 'Giải ngân một phần' },
    { value: LoanApplicationStatus.FULLY_DISBURSED, label: 'Đã giải ngân toàn bộ' }
  ];

  // Sort options
  sortOptions = [
    { value: 'updatedAt', label: 'Ngày cập nhật' },
    { value: 'createdAt', label: 'Ngày tạo' },
    { value: 'requestedAmount', label: 'Số tiền vay' },
    { value: 'requestedTerm', label: 'Thời hạn vay' }
  ];

  constructor(private applicationService: ApplicationService) { }

  ngOnInit(): void {
    this.loadApprovedLoans();
  }

  // Load approved loans for current user
  loadApprovedLoans(): void {
    this.isLoading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sort: `${this.sortBy},${this.sortDirection}`
    };

    this.applicationService.getCurrentUserLoanApplications(params).subscribe({
      next: (response) => {
        if (response) {
          // Filter only approved, partially disbursed, and fully disbursed loans
          this.approvedLoans = response.content.filter(loan =>
            loan.status === LoanApplicationStatus.APPROVED ||
            loan.status === LoanApplicationStatus.PARTIALLY_DISBURSED ||
            loan.status === LoanApplicationStatus.FULLY_DISBURSED
          );

          // Apply additional status filter if selected
          if (this.statusFilter !== 'ALL') {
            this.approvedLoans = this.approvedLoans.filter(loan => loan.status === this.statusFilter);
          }

          this.totalElements = this.approvedLoans.length;
          this.totalPages = Math.ceil(this.totalElements / this.pageSize);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách khoản vay. Vui lòng thử lại.';
        this.isLoading = false;
        console.error('Error loading approved loans:', error);
      }
    });
  }

  // Filter and sort functionality
  onFilterChange(): void {
    this.currentPage = 0;
    this.loadApprovedLoans();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadApprovedLoans();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  // Pagination
  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadApprovedLoans();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadApprovedLoans();
  }

  // Modal functionality
  openDetailModal(loan: LoanApplicationResponse): void {
    this.selectedLoan = loan;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedLoan = null;
  }

  // Helper methods
  formatCurrency(amount: number): string {
    return this.applicationService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return this.applicationService.formatDate(dateString);
  }

  getStatusLabel(status: LoanApplicationStatus): string {
    return this.applicationService.getStatusLabel(status);
  }

  getStatusColorClass(status: LoanApplicationStatus): string {
    return this.applicationService.getStatusColorClass(status);
  }

  // Calculate progress for disbursement status
  calculateDisbursementProgress(status: LoanApplicationStatus): number {
    switch (status) {
      case LoanApplicationStatus.APPROVED:
        return 0;
      case LoanApplicationStatus.PARTIALLY_DISBURSED:
        return 50; // Assuming 50% for partial disbursement
      case LoanApplicationStatus.FULLY_DISBURSED:
        return 100;
      default:
        return 0;
    }
  }

  // Get progress color class
  getProgressColorClass(progress: number): string {
    if (progress === 0) return 'bg-yellow-500';
    if (progress < 100) return 'bg-blue-500';
    return 'bg-green-500';
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

  // Calculate monthly payment (simplified calculation)
  calculateMonthlyPayment(amount: number, term: number, interestRate: number): number {
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(payment);
  }

  // Calculate total loan amount
  getTotalLoanAmount(): number {
    return this.approvedLoans.reduce((total, loan) => total + (loan.requestedAmount || 0), 0);
  }

  // Get count of active loans (partially or fully disbursed)
  getActiveLoanCount(): number {
    return this.approvedLoans.filter(loan =>
      loan.status === LoanApplicationStatus.PARTIALLY_DISBURSED ||
      loan.status === LoanApplicationStatus.FULLY_DISBURSED
    ).length;
  }

  // Refresh data
  refreshData(): void {
    this.loadApprovedLoans();
  }
}
