import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LoanService, LoanProduct } from '../../services/loan.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.css'],
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
export class HomePageComponent implements OnInit {
    isLoggedIn = false;
    popularLoans: LoanProduct[] = [];
    isLoading: boolean = false;
    error: string | null = null;

    // Modal properties
    selectedProduct: LoanProduct | null = null;
    isModalOpen: boolean = false;
    isLoadingProduct: boolean = false;
    productError: string | null = null; constructor(
        private userService: UserService,
        private loanService: LoanService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Subscribe để luôn cập nhật khi thông tin người dùng thay đổi
        this.userService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
        });

        // Lấy 3 khoản vay phổ biến nhất
        this.loadPopularLoans();
    }

    loadPopularLoans(): void {
        this.isLoading = true;
        this.error = null;

        this.loanService.getLoanProducts(0, 3).subscribe({
            next: (response) => {
                if (response && response.data) {
                    this.popularLoans = response.data.content;
                } else {
                    this.popularLoans = [];
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Không thể tải danh sách khoản vay phổ biến.';
                this.isLoading = false;
                console.error('Error loading popular loans:', err);
            }
        });
    } formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    }    // Phương thức mở modal chi tiết sản phẩm vay
    openProductDetails(product: LoanProduct): void {
        this.isLoadingProduct = true;
        this.productError = null;

        // Sử dụng getLoanProductById để lấy thông tin chi tiết
        this.loanService.getLoanProductById(product.id).subscribe({
            next: (response) => {
                if (response && response.data) {
                    this.selectedProduct = response.data;
                    this.isModalOpen = true;
                    // Ngăn không cho cuộn trang khi modal đang mở
                    document.body.style.overflow = 'hidden';
                }
                this.isLoadingProduct = false;
            },
            error: (err) => {
                this.productError = 'Không thể tải thông tin chi tiết khoản vay. Vui lòng thử lại sau.';
                this.isLoadingProduct = false;
                console.error('Error loading loan product details:', err);
            }
        });
    }

    // Đóng modal
    closeModal(): void {
        this.isModalOpen = false;
        // Cho phép cuộn trang trở lại
        document.body.style.overflow = 'auto';
    }

    // Đăng ký vay
    applyForLoan(product: LoanProduct): void {
        // Đóng modal
        this.closeModal();
        // Điều hướng đến trang đăng ký vay với ID sản phẩm
        this.router.navigate(['/borrower-portal/loan-application-form'], {
            queryParams: { productId: product.id }
        });
    }

    // Đóng modal khi nhấn phím ESC
    @HostListener('document:keydown.escape')
    onKeydownHandler() {
        if (this.isModalOpen) {
            this.closeModal();
        }
    }

    // Đóng modal khi click ra ngoài
    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        const modalElement = document.querySelector('.bg-white');
        if (this.isModalOpen && modalElement && !modalElement.contains(event.target as Node)) {
            this.closeModal();
        }
    }
}
