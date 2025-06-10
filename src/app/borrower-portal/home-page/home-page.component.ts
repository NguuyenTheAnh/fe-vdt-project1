import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LoanService, LoanProduct } from '../../services/loan.service';
import { SystemConfigService } from '../../services/system-config.service';
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
    error: string | null = null;    // Modal properties
    selectedProduct: LoanProduct | null = null;
    isModalOpen: boolean = false;
    isLoadingProduct: boolean = false;
    productError: string | null = null;

    // Document type display mapping for Vietnamese localization
    documentTypeDisplayMap: { [key: string]: string } = {}; constructor(
        private userService: UserService,
        private loanService: LoanService,
        private router: Router,
        private configService: SystemConfigService
    ) { } ngOnInit(): void {
        // Subscribe để luôn cập nhật khi thông tin người dùng thay đổi
        this.userService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
        });

        // Lấy 3 khoản vay phổ biến nhất
        this.loadPopularLoans();

        // Tải cấu hình tài liệu yêu cầu
        this.loadDocumentTypeMapping();
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
    }

    /**
     * Tải mapping document types từ system config để hiển thị tiếng Việt
     */
    async loadDocumentTypeMapping(): Promise<void> {
        try {
            this.documentTypeDisplayMap = await this.configService.getRequiredDocuments();
        } catch (error) {
            console.error('Error loading document type mapping:', error);
            // Fallback mapping nếu không load được từ system config
            this.documentTypeDisplayMap = {
                'ID_CARD': 'Căn cước công dân/CMND',
                'HOUSEHOLD_REGISTRATION': 'Sổ hộ khẩu',
                'INCOME_CERTIFICATE': 'Giấy xác nhận thu nhập',
                'BANK_STATEMENT': 'Sao kê ngân hàng',
                'MARRIAGE_CERTIFICATE': 'Giấy chứng nhận kết hôn',
                'WORK_CONTRACT': 'Hợp đồng lao động',
                'TAX_DECLARATION': 'Tờ khai thuế',
                'PROPERTY_CERTIFICATE': 'Giấy chứng nhận quyền sở hữu tài sản',
                'COLLATERAL_DOCUMENT': 'Tài liệu tài sản thế chấp',
                'BUSINESS_LICENSE': 'Giấy phép kinh doanh'
            };
        }
    }    /**
     * Format required documents từ chuỗi tiếng Anh sang tiếng Việt
     */
    formatRequiredDocuments(requiredDocuments: string): string {
        if (!requiredDocuments) return '';

        // Split bằng dấu cách hoặc dấu phẩy để lấy các document types
        const documentTypes = requiredDocuments.split(/[\s,]+/).filter(doc => doc.trim() !== '');

        // Map các document types sang tiếng Việt
        const vietnameseDocuments = documentTypes.map(doc => {
            const displayName = this.documentTypeDisplayMap[doc.trim()];
            return displayName || doc; // Fallback về tên gốc nếu không tìm thấy
        });

        return vietnameseDocuments.join(', ');
    }

    /**
     * Lấy danh sách tài liệu yêu cầu dưới dạng array để hiển thị từng dòng
     */
    getRequiredDocumentsList(requiredDocuments: string): string[] {
        if (!requiredDocuments) return [];

        // Split bằng dấu cách hoặc dấu phẩy để lấy các document types
        const documentTypes = requiredDocuments.split(/[\s,]+/).filter(doc => doc.trim() !== '');

        // Map các document types sang tiếng Việt
        const vietnameseDocuments = documentTypes.map(doc => {
            const displayName = this.documentTypeDisplayMap[doc.trim()];
            return displayName || doc; // Fallback về tên gốc nếu không tìm thấy
        });

        return vietnameseDocuments;
    }

    // Phương thức mở modal chi tiết sản phẩm vay
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
