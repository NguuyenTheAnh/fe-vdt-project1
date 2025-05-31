import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LoanService, LoanProduct, PageableResponse } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-loan-product-list',
  templateUrl: './loan-product-list.component.html',
  styleUrls: ['./loan-product-list.component.css'],
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
  isLoading: boolean = true;
  error: string | null = null;
  selectedProduct: LoanProduct | null = null;
  isModalOpen: boolean = false;
  isLoggedIn: boolean = false;

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 6;
  totalPages: number = 0;
  totalElements: number = 0;

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

    this.loanService.getLoanProducts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.loanProducts = response.data.content;
          // Cập nhật thông tin phân trang
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.currentPage = response.data.number;
        } else {
          this.loanProducts = [];
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Phương thức chuyển trang
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLoanProducts();
    }
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

  openProductDetails(product: LoanProduct): void {
    // Hiển thị loading
    this.selectedProduct = product;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';

    // Gọi API để lấy thông tin chi tiết
    this.loanService.getLoanProductById(product.id).subscribe({
      next: (response) => {
        if (response && response.data) {
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
    const modalElement = document.querySelector('.bg-white');
    if (this.isModalOpen && modalElement && !modalElement.contains(event.target as Node)) {
      this.closeModal();
    }
  }
}