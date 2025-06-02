import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LoanService, LoanProduct, PageableResponse } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-loan-product-list',
  templateUrl: './loan-product-list.component.html',
  styleUrls: ['./loan-product-list.component.css', './modal-fix.css'],
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
export class LoanProductListComponent implements OnInit {
  loanProducts: LoanProduct[] = [];
  filteredProducts: LoanProduct[] = []; // For search/filter results
  isLoading: boolean = true;
  error: string | null = null;
  selectedProduct: LoanProduct | null = null;
  isModalOpen: boolean = false;
  isLoggedIn: boolean = false;

  // Search and filter properties
  searchTerm: string = '';
  interestRateRange: [number, number] = [0, 30]; // Default interest rate range
  amountRange: [number, number] = [0, 1000000000]; // Default amount range in VND
  termRange: [number, number] = [1, 60]; // Default term range in months

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 6; // Hiển thị mặc định 6 khoản vay mỗi trang
  totalPages: number = 0;
  totalElements: number = 0;

  // Sorting
  sortField: string = 'id';
  sortDirection: string = 'desc';

  constructor(
    private loanService: LoanService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loadLoanProducts();
  }

  loadLoanProducts(): void {
    this.isLoading = true;
    this.error = null;

    const sortParam = `${this.sortField},${this.sortDirection}`;

    this.loanService.getLoanProducts(this.currentPage, this.pageSize, sortParam).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response && response.data) {
          this.loanProducts = response.data.content;
          this.filteredProducts = [...this.loanProducts]; // Initialize filtered products

          // Cập nhật thông tin phân trang
          this.totalPages = response.data.totalPages || 0;
          this.totalElements = response.data.totalElements || 0;
          this.currentPage = response.data.number || 0;

          // Debug information
          console.log('Total Pages:', this.totalPages);
          console.log('Current Page:', this.currentPage);
          console.log('Products count:', this.filteredProducts.length);

          // Ensure totalPages is at least 1 if we have products (fix for pagination visibility)
          if (this.loanProducts.length > 0 && this.totalPages === 0) {
            this.totalPages = Math.ceil(this.loanProducts.length / this.pageSize) || 1;
            console.log('Corrected Total Pages:', this.totalPages);
          }

          // Apply any current filters
          this.applyFilters();
        } else {
          this.loanProducts = [];
          this.filteredProducts = [];
          this.totalPages = 0;
          console.log('No data in response or invalid response format');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách khoản vay. Vui lòng thử lại sau.';
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

    // Update pagination values based on filtered results when doing client-side filtering
    // Note: This ensures pagination is shown correctly even with client-side filtering
    if (this.totalPages <= 1 && this.filteredProducts.length > this.pageSize) {
      this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
      console.log('Updated total pages based on filtered results:', this.totalPages);
    }
  }

  // Search method
  onSearch(): void {
    this.applyFilters();
  }

  // Reset all filters
  resetFilters(): void {
    this.searchTerm = '';
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Phương thức chuyển trang
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

  // Lấy mảng các số trang để hiển thị trong phân trang
  get pages(): number[] {
    const result: number[] = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      result.push(i);
    }

    return result;
  }

  // Tạo mảng các số trang hiển thị cho pagination kiểu "< 1 2 3 >"
  getPaginationRange(): (number | string)[] {
    const result: (number | string)[] = [];

    // Guard clause - nếu không có trang nào thì trả về mảng trống
    if (!this.totalPages || this.totalPages <= 0) {
      console.log('No pages available for pagination');
      return [];
    }

    const currentPage = this.currentPage + 1; // Convert to 1-based for display
    const totalPages = this.totalPages;

    console.log('getPaginationRange - totalPages:', totalPages);
    console.log('getPaginationRange - currentPage:', currentPage);

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

    console.log('Pagination range result:', result);

    return result;
  }

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

  applyForLoan(product: LoanProduct): void {
    // Close the modal
    this.closeModal();
    // Navigate to loan application form with product ID
    this.router.navigate(['/borrower-portal/loan-application-form'], {
      queryParams: { productId: product.id }
    });
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