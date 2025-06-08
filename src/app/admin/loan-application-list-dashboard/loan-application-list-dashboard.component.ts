import { Component, OnInit } from '@angular/core';
import { ApplicationService, LoanApplicationResponse, PagedLoanApplicationResponse, LoanApplicationStatus, GetLoanApplicationsParams } from '../../services/application.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-loan-application-list-dashboard',
  templateUrl: './loan-application-list-dashboard.component.html',
  styleUrls: ['./loan-application-list-dashboard.component.css']
})
export class LoanApplicationListDashboardComponent implements OnInit {
  // Data properties
  loanApplications: LoanApplicationResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  selectedStatus: LoanApplicationStatus | '' = '';
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Available status options for filter
  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: LoanApplicationStatus.NEW, label: 'Mới' },
    { value: LoanApplicationStatus.PENDING, label: 'Đang xử lý' },
    { value: LoanApplicationStatus.REQUIRE_MORE_INFO, label: 'Cần thêm thông tin' },
    { value: LoanApplicationStatus.APPROVED, label: 'Đã duyệt' },
    { value: LoanApplicationStatus.REJECTED, label: 'Bị từ chối' },
    { value: LoanApplicationStatus.PARTIALLY_DISBURSED, label: 'Giải ngân một phần' },
    { value: LoanApplicationStatus.FULLY_DISBURSED, label: 'Đã giải ngân hoàn tất' }
  ];

  // Sort options
  sortOptions = [
    { value: 'createdAt', label: 'Ngày tạo' },
    { value: 'requestedAmount', label: 'Số tiền vay' },
    { value: 'status', label: 'Trạng thái' },
    { value: 'user.fullName', label: 'Tên khách hàng' }
  ];

  // Page size options
  pageSizeOptions = [5, 10, 20, 50];

  // Modal properties
  selectedApplication: LoanApplicationResponse | null = null;
  isModalOpen = false;

  // Document modal properties
  isDocumentModalOpen = false;
  selectedApplicationDocuments: { [key: string]: any } | null = null;
  isLoadingDocuments = false;
  documentError: string | null = null;

  // Status update properties
  isUpdatingStatus = false;
  newStatus: LoanApplicationStatus | null = null;
  internalNotes = '';
  showNotesField = false;

  constructor(private applicationService: ApplicationService) { }

  ngOnInit(): void {
    this.loadLoanApplications();
  }

  // Load loan applications with current filters and pagination
  loadLoanApplications(): void {
    this.isLoading = true;
    this.error = null;

    const params: GetLoanApplicationsParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: `${this.sortBy},${this.sortDirection}`
    };

    this.applicationService.getAllLoanApplications(params).subscribe({
      next: (response: PagedLoanApplicationResponse | null) => {
        if (response) {
          this.loanApplications = this.filterApplications(response.content);
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách đơn vay. Vui lòng thử lại.';
        this.isLoading = false;
        console.error('Error loading loan applications:', error);
      }
    });
  }

  // Filter applications based on search term and status
  private filterApplications(applications: LoanApplicationResponse[]): LoanApplicationResponse[] {
    return applications.filter(app => {
      const matchesSearch = !this.searchTerm ||
        app.user.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.loanProduct.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus || app.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 0;
    this.loadLoanApplications();
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadLoanApplications();
  }

  // Sort functionality
  onSortChange(): void {
    this.currentPage = 0;
    this.loadLoanApplications();
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
      this.loadLoanApplications();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadLoanApplications();
  }

  // Modal functionality
  openApplicationDetail(application: LoanApplicationResponse): void {
    this.selectedApplication = application;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedApplication = null;
    this.newStatus = null;
    this.internalNotes = '';
    this.showNotesField = false;
  }

  // Document modal functionality
  openDocumentModal(application: LoanApplicationResponse): void {
    this.selectedApplicationDocuments = null; // Reset documents
    this.isDocumentModalOpen = true;
    this.loadApplicationDocuments(application.id);
  }

  closeDocumentModal(): void {
    this.isDocumentModalOpen = false;
    this.selectedApplicationDocuments = null;
  }

  // Load documents for the selected application
  private loadApplicationDocuments(applicationId: number): void {
    this.isLoadingDocuments = true;
    this.documentError = null;

    this.applicationService.getRequiredDocuments(applicationId).subscribe({
      next: (documents) => {
        this.selectedApplicationDocuments = documents;
        this.isLoadingDocuments = false;
      },
      error: (error) => {
        this.documentError = 'Không thể tải tài liệu. Vui lòng thử lại.';
        this.isLoadingDocuments = false;
        console.error('Error loading documents:', error);
      }
    });
  }

  // Get document URL for viewing
  getDocumentUrl(fileName: string): string {
    return `${environment.apiUrl}/uploads/${fileName}`;
  }

  // Helper method to check if documents object is empty
  hasDocuments(): boolean {
    return !!(this.selectedApplicationDocuments && Object.keys(this.selectedApplicationDocuments).length > 0);
  }

  // Helper method to get document entries for iteration
  getDocumentEntries(): Array<{ key: string, value: any }> {
    if (!this.selectedApplicationDocuments) return [];
    return Object.entries(this.selectedApplicationDocuments).map(([key, value]) => ({ key, value }));
  }

  // Status update functionality
  updateApplicationStatus(applicationId: number, newStatus: LoanApplicationStatus): void {
    this.isUpdatingStatus = true;

    // Get internal notes if provided
    const notes = this.internalNotes.trim() || undefined;

    // Use the admin management method which includes notifications and email
    this.applicationService.updateLoanApplicationStatusWithManagement(applicationId, newStatus, notes).subscribe({
      next: (updatedApplication) => {
        if (updatedApplication) {
          // Update the application in the list
          const index = this.loanApplications.findIndex(app => app.id === applicationId);
          if (index !== -1) {
            this.loanApplications[index] = updatedApplication;
          }

          // Update selected application if it's the same one
          if (this.selectedApplication && this.selectedApplication.id === applicationId) {
            this.selectedApplication = updatedApplication;
          }

          // Show success message
          this.error = null;
        }

        // Clear internal notes and hide the field
        this.clearNotes();
        this.showNotesField = false;
        this.isUpdatingStatus = false;
      },
      error: (error) => {
        this.error = 'Không thể cập nhật trạng thái. Vui lòng thử lại.';
        this.isUpdatingStatus = false;
        console.error('Error updating status:', error);
      }
    });
  }

  // Helper methods from service
  getStatusLabel(status: LoanApplicationStatus): string {
    return this.applicationService.getStatusLabel(status);
  }

  getStatusColorClass(status: LoanApplicationStatus): string {
    return this.applicationService.getStatusColorClass(status);
  }

  formatCurrency(amount: number): string {
    return this.applicationService.formatCurrency(amount);
  }

  formatDate(dateString: string | null): string {
    return this.applicationService.formatDate(dateString);
  }

  // Helper method for status update
  updateStatus(applicationId: number, statusValue: string): void {
    if (statusValue && statusValue !== '') {
      const status = statusValue as LoanApplicationStatus;
      this.updateApplicationStatus(applicationId, status);
    }
  }

  // Toggle internal notes field visibility
  toggleNotesField(): void {
    this.showNotesField = !this.showNotesField;
    if (!this.showNotesField) {
      this.internalNotes = '';
    }
  }

  // Clear internal notes
  clearNotes(): void {
    this.internalNotes = '';
  }

  // Check if status change requires confirmation
  requiresConfirmation(currentStatus: LoanApplicationStatus, newStatus: LoanApplicationStatus): boolean {
    return this.applicationService.canChangeStatus(currentStatus, newStatus);
  }

  // Get available status options for a specific application
  getAvailableStatusOptions(currentStatus: LoanApplicationStatus): Array<{ value: LoanApplicationStatus, label: string }> {
    // Only allow APPROVED and REJECTED status updates in the modal
    const allowedStatuses = [LoanApplicationStatus.APPROVED, LoanApplicationStatus.REJECTED];

    return this.applicationService.getStatusOptions().filter(option =>
      allowedStatuses.includes(option.value) &&
      this.applicationService.canChangeStatus(currentStatus, option.value)
    );
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

  // Export functionality (optional)
  exportApplications(): void {
    // Implementation for exporting applications to CSV/Excel
    console.log('Export functionality to be implemented');
  }

  // Refresh data
  refreshData(): void {
    this.loadLoanApplications();
  }
}
