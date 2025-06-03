import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LoanService, LoanProduct, PageableResponse } from '../../services/loan.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-loan-product-list-dashboard',
  templateUrl: './loan-product-list-dashboard.component.html',
  styleUrls: ['./loan-product-list-dashboard.component.css'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class LoanProductListDashboardComponent implements OnInit {
  loanProducts: LoanProduct[] = [];
  filteredProducts: LoanProduct[] = []; // For search/filter results
  isLoading: boolean = true;
  error: string | null = null;
  selectedProduct: LoanProduct | null = null;
  isModalOpen: boolean = false;
  // Search and filter properties
  searchTerm: string = '';
  statusFilter: string = 'ALL';
  interestRateRange: [number, number] = [0, 30]; // Default interest rate range
  amountRange: [number, number] = [0, 1000000000]; // Default amount range in VND
  termRange: [number, number] = [1, 60]; // Default term range in months

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 10; // Default 10 products per page
  totalPages: number = 0;
  totalElements: number = 0;

  // Sorting
  sortField: string = 'id';
  sortDirection: string = 'desc';

  constructor(
    private loanService: LoanService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadLoanProducts();
  }

  loadLoanProducts(): void {
    this.isLoading = true;
    this.error = null;

    const sortParam = `${this.sortField},${this.sortDirection}`;

    this.loanService.getLoanProducts(this.currentPage, this.pageSize, sortParam).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.loanProducts = response.data.content;

          // Cập nhật thông tin phân trang
          this.totalPages = response.data.totalPages || 0;
          this.totalElements = response.data.totalElements || 0;
          this.currentPage = response.data.number || 0;

          // Apply any current filters
          this.applyFilters();
        } else {
          this.loanProducts = [];
          this.filteredProducts = [];
          this.totalPages = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách sản phẩm vay. Vui lòng thử lại sau.';
        this.isLoading = false;
        console.error('Error loading loan products:', err);
      }
    });
  }
  // Apply search and filters
  applyFilters(): void {
    if (!this.loanProducts.length) return;

    let filtered = [...this.loanProducts];

    // Apply search term filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(product => product.status === this.statusFilter);
    }

    // Apply interest rate filter
    filtered = filtered.filter(product =>
      product.interestRate >= this.interestRateRange[0] &&
      product.interestRate <= this.interestRateRange[1]
    );

    // Apply amount filter (min amount must be less than or equal to the max filter, or max amount must be greater than or equal to min filter)
    filtered = filtered.filter(product =>
      (product.minAmount <= this.amountRange[1] && product.maxAmount >= this.amountRange[0])
    );

    // Apply term filter
    filtered = filtered.filter(product =>
      (product.minTerm <= this.termRange[1] && product.maxTerm >= this.termRange[0])
    );

    this.filteredProducts = filtered;
  }

  // Search method
  onSearch(): void {
    this.applyFilters();
  }
  // Reset all filters
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.interestRateRange = [0, 30];
    this.amountRange = [0, 1000000000];
    this.termRange = [1, 60];
    this.filteredProducts = [...this.loanProducts];
  }

  // Sort products
  sortProducts(field: string): void {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc'; // Default to ascending for new field
    }

    this.currentPage = 0; // Reset to first page when sorting
    this.loadLoanProducts();
  }

  // Get icon for sort indication
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'sort';
    }
    return this.sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending';
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format required documents from string to HTML list
  formatRequiredDocuments(documents: string): string {
    try {
      // Try to parse as JSON array
      const docArray = JSON.parse(documents);
      if (Array.isArray(docArray)) {
        return docArray.map(doc => `<div class="mb-1">• ${doc}</div>`).join('');
      }
      // If not JSON array, split by newlines or commas
      return documents.split(/[\n,]+/).map(doc =>
        `<div class="mb-1">• ${doc.trim()}</div>`
      ).join('');
    } catch {
      // If can't parse as JSON, split by newlines or commas
      return documents.split(/[\n,]+/).map(doc =>
        `<div class="mb-1">• ${doc.trim()}</div>`
      ).join('');
    }
  }

  // Display name for status filter
  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'INACTIVE': return 'Không hoạt động';
      default: return 'Tất cả';
    }
  }

  // Page navigation
  goToPage(page: number): void {
    // Ensure page is a valid number
    page = Number(page);
    if (isNaN(page)) page = 0;

    // Make sure we have valid totalPages
    const maxPage = Math.max(1, this.totalPages || 1) - 1;

    // Validate the page range
    if (page >= 0 && page <= maxPage) {
      this.currentPage = page;
      this.loadLoanProducts();

      // Scroll to top of products list for better UX
      setTimeout(() => {
        const container = document.querySelector('.container');
        if (container) {
          window.scrollTo({
            top: container.getBoundingClientRect().top + window.scrollY - 100,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }

  // For NG-Zorro pagination
  onPageIndexChange(index: number): void {
    // NG-Zorro pagination is 1-based, but our API is 0-based
    this.goToPage(index - 1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Reset to first page when changing page size
    this.loadLoanProducts();
  }

  // Tạo mảng các số trang hiển thị cho pagination kiểu "< 1 2 3 >"
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

  // Open product details modal
  openProductDetails(product: LoanProduct): void {
    // First set initial product data to prevent modal flickering
    this.selectedProduct = product;

    // Immediately open modal with initial data to improve perceived performance
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';

    // Call API to load detailed product info
    this.loanService.getLoanProductById(product.id).subscribe({
      next: (response) => {
        if (response && response.data) {
          // Update with complete data
          this.selectedProduct = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading loan product details:', err);
      }
    });
  }

  // Close modal
  closeModal(): void {
    this.isModalOpen = false;
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';
    // Add a small delay before clearing the selected product
    setTimeout(() => {
      if (!this.isModalOpen) {
        // Only clear if modal is still closed (prevents flickering if reopened quickly)
        this.selectedProduct = null;
      }
    }, 200); // Match the animation out duration
  }

  // Create new product - navigate to product creation page or open form
  createNewProduct(): void {
    // Implementation pending - could navigate to a create form or open a modal
    // this.router.navigate(['/admin/loan-products/create']);
    alert('Chức năng tạo sản phẩm vay mới đang được phát triển');
  }

  // Edit product - navigate to edit page or open form
  editProduct(product: LoanProduct): void {
    // Implementation pending - could navigate to an edit form with the product ID
    // this.router.navigate([`/admin/loan-products/edit/${product.id}`]);
    alert(`Chức năng chỉnh sửa sản phẩm vay đang được phát triển. ID: ${product.id}`);
  }

  // Close modal when clicking outside or pressing Escape key
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isModalOpen) {
      this.closeModal();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    // Check if click was on the modal overlay (the semi-transparent background)
    // But not on the modal content itself (which would have stopped propagation)
    if (this.isModalOpen && event.target instanceof Element) {
      const isModalOverlay = event.target.classList.contains('modal-overlay');
      if (isModalOverlay) {
        this.closeModal();
      }
    }
  }
}
