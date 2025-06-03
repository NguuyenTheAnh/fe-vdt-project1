import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LoanService, LoanProduct, PageableResponse } from '../../services/loan.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { NzNotificationService } from 'ng-zorro-antd/notification';

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
  selectedProduct: LoanProduct | null = null; isModalOpen: boolean = false; isEditMode: boolean = false; // Chế độ chỉnh sửa
  isCreatingNew: boolean = false; // Chế độ tạo mới sản phẩm
  isSaving: boolean = false; // Trạng thái đang lưu
  editingProduct: any = {}; // Bản nháp để chỉnh sửa
  selectedDocuments: string[] = []; // Danh sách tài liệu đã chọn
  showDocumentSelector: boolean = false; // Hiển thị selector tài liệu

  // Document selector search
  documentSearchTerm: string = '';
  filteredDocumentTypes: { key: string; value: string }[] = [];

  // Map các mã tài liệu sang tên hiển thị tiếng Việt
  documentTypeDisplayMap: { [key: string]: string } = {
    'ID_CARD': 'CMND/CCCD',
    'PROOF_OF_INCOME': 'Chứng minh thu nhập',
    'PROOF_OF_ADDRESS': 'Chứng minh địa chỉ',
    'EMPLOYMENT_VERIFICATION': 'Xác nhận việc làm',
    'BANK_STATEMENT': 'Sao kê ngân hàng',
    'COLLATERAL_DOCUMENT': 'Tài liệu tài sản đảm bảo',
    'BUSINESS_LICENSE': 'Giấy phép kinh doanh',
    'TAX_RETURN': 'Tờ khai thuế',
    'INSURANCE_POLICY': 'Hợp đồng bảo hiểm',
    'PROPERTY_OWNERSHIP': 'Giấy tờ sở hữu tài sản',
    'MARRIAGE_CERTIFICATE': 'Giấy chứng nhận kết hôn',
    'BIRTH_CERTIFICATE': 'Giấy khai sinh',
    'UTILITY_BILL': 'Hóa đơn tiện ích',
    'VEHICLE_REGISTRATION': 'Đăng ký phương tiện',
    'TRAVEL_ITINERARY': 'Lịch trình du lịch',
    'FISHING_LICENSE': 'Giấy phép đánh bắt cá',
    'IMPORT_CONTRACT': 'Hợp đồng nhập khẩu',
    'ADMISSION_LETTER': 'Thư nhập học',
    'BUSINESS_PLAN': 'Kế hoạch kinh doanh',
    'DRIVING_LICENSE': 'Giấy phép lái xe',
    'EQUIPMENT_PURCHASE_CONTRACT': 'Hợp đồng mua thiết bị',
    'ENVIRONMENTAL_PERMIT': 'Giấy phép môi trường',
    'EXPORT_CONTRACT': 'Hợp đồng xuất khẩu',
    'FARMING_PLAN': 'Kế hoạch canh tác',
    'FINANCIAL_STATEMENT': 'Báo cáo tài chính',
    'LAND_OWNERSHIP_CERTIFICATE': 'Giấy chứng nhận quyền sử dụng đất',
    'LAND_USE_RIGHTS': 'Giấy quyền sử dụng đất',
    'MEDICAL_INVOICE': 'Hóa đơn y tế',
    'PROPERTY_DOCUMENT': 'Giấy tờ tài sản',
    'SALARY_STATEMENT': 'Bảng lương',
    'STUDENT_ID': 'Thẻ sinh viên',
    'STUDENT_VISA': 'Visa du học',
    'TUITION_INVOICE': 'Hóa đơn học phí',
    'VEHICLE_CONTRACT': 'Hợp đồng mua xe',
    'VEHICLE_PURCHASE_CONTRACT': 'Hợp đồng mua phương tiện'
  };
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
    private router: Router,
    private notification: NzNotificationService
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
      }, error: (err) => {
        this.error = 'Không thể tải danh sách sản phẩm vay. Vui lòng thử lại sau.';
        this.isLoading = false;
        console.error('Error loading loan products:', err);

        // Hiển thị thông báo lỗi
        this.notification.error(
          'Lỗi',
          'Không thể tải danh sách sản phẩm vay. Vui lòng thử lại sau.',
          { nzDuration: 3000 }
        );
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
    if (!documents) return '';

    try {
      // Bước 1: Thử phân tích dưới dạng mảng JSON
      const docArray = JSON.parse(documents);
      if (Array.isArray(docArray)) {
        return docArray.map(doc => {
          // Chuyển đổi mã tài liệu sang tên hiển thị tiếng Việt
          const displayName = this.documentTypeDisplayMap[doc] || doc;
          return `<div class="mb-1">• ${displayName}</div>`;
        }).join('');
      }
      // Nếu là một chuỗi JSON, tiếp tục xử lý như một chuỗi thông thường
    } catch { }

    // Bước 2: Tách chuỗi theo nhiều dấu phân cách có thể (khoảng trắng, dòng mới, dấu phẩy)
    // Xử lý trường hợp như "ID_CARD FISHING_LICENSE"
    const docCodes = documents.split(/[\s,]+/);

    // Bước 3: Xử lý từng mã tài liệu và chuyển đổi sang tên hiển thị tiếng Việt
    return docCodes.map(code => {
      const trimmedCode = code.trim();
      if (!trimmedCode) return '';

      // Chuyển đổi mã tài liệu sang tên hiển thị tiếng Việt
      const displayName = this.documentTypeDisplayMap[trimmedCode] || trimmedCode;
      return `<div class="mb-1">• ${displayName}</div>`;
    }).filter(item => item).join('');
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
      }, error: (err) => {
        console.error('Error loading loan product details:', err);

        // Hiển thị thông báo lỗi
        this.notification.error(
          'Lỗi',
          'Không thể tải chi tiết sản phẩm vay. Vui lòng thử lại sau.',
          { nzDuration: 3000 }
        );
      }
    });
  }
  // Close modal
  closeModal(): void {
    this.isModalOpen = false;
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';

    // Reset creation/edit mode
    if (this.isEditMode) {
      this.cancelEdit();
    }

    // Add a small delay before clearing the selected product
    setTimeout(() => {
      if (!this.isModalOpen) {
        // Only clear if modal is still closed (prevents flickering if reopened quickly)
        this.selectedProduct = null;
      }
    }, 200); // Match the animation out duration
  }
  // Create new product - opens the create product modal
  createNewProduct(): void {
    // Initialize a new empty product
    this.editingProduct = {
      name: '',
      description: '',
      interestRate: 0,
      minAmount: 0,
      maxAmount: 0,
      minTerm: 1,
      maxTerm: 12,
      status: 'ACTIVE',
      requiredDocuments: ''
    };

    // Clear selected documents
    this.selectedDocuments = [];

    // Set creating new mode
    this.isCreatingNew = true;
    this.isEditMode = true;

    // Open the modal
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }
  // Bắt đầu chế độ chỉnh sửa sản phẩm
  editProduct(product: LoanProduct): void {
    if (!this.selectedProduct && product) {
      // Nếu được gọi từ danh sách, mở modal chi tiết trước
      this.openProductDetails(product);
      // Đặt hẹn giờ để đảm bảo modal đã mở và dữ liệu đã được tải đầy đủ
      setTimeout(() => {
        this.startEditMode();
      }, 500);
    } else {
      // Nếu đã đang ở trong modal, chuyển sang chế độ chỉnh sửa ngay lập tức
      this.startEditMode();
    }
  }

  // Bắt đầu chế độ chỉnh sửa
  startEditMode(): void {
    if (!this.selectedProduct) return;

    // Sao chép dữ liệu sản phẩm hiện tại để chỉnh sửa
    this.editingProduct = { ...this.selectedProduct };

    // Phân tích tài liệu yêu cầu thành mảng
    if (this.editingProduct.requiredDocuments) {
      try {
        // Thử phân tích như JSON
        let docs = this.editingProduct.requiredDocuments;
        try {
          const parsedDocs = JSON.parse(docs);
          if (Array.isArray(parsedDocs)) {
            this.selectedDocuments = [...parsedDocs];
          } else {
            // Nếu không phải mảng, phân tách theo khoảng trắng/dấu phẩy
            this.selectedDocuments = docs.split(/[\s,]+/).filter((doc: string) => doc.trim());
          }
        } catch {
          // Nếu không phải JSON, phân tách theo khoảng trắng/dấu phẩy
          this.selectedDocuments = docs.split(/[\s,]+/).filter((doc: string) => doc.trim());
        }
      } catch (error) {
        console.error("Lỗi khi phân tích tài liệu:", error);
        this.selectedDocuments = [];
      }
    } else {
      this.selectedDocuments = [];
    }

    // Bật chế độ chỉnh sửa
    this.isEditMode = true;
  }

  // Thêm tài liệu yêu cầu mới
  addDocument(document: string): void {
    if (!this.selectedDocuments.includes(document)) {
      this.selectedDocuments.push(document);
      this.updateRequiredDocumentsString();
    }
    this.showDocumentSelector = false;
  }

  // Xóa tài liệu khỏi danh sách
  removeDocument(document: string): void {
    this.selectedDocuments = this.selectedDocuments.filter(doc => doc !== document);
    this.updateRequiredDocumentsString();
  }

  // Cập nhật chuỗi tài liệu từ mảng đã chọn
  updateRequiredDocumentsString(): void {
    this.editingProduct.requiredDocuments = this.selectedDocuments.join(' ');
  }
  // Lưu thay đổi
  saveChanges(): void {
    if (!this.editingProduct) return;

    this.isSaving = true;

    // Đảm bảo requiredDocuments được cập nhật từ selectedDocuments
    this.updateRequiredDocumentsString();

    if (this.isCreatingNew) {
      this.loanService.createLoanProduct(this.editingProduct).subscribe({
        next: (response) => {
          if (response && response.data) {
            // Thêm sản phẩm mới vào danh sách
            this.loanProducts.unshift(response.data);

            // Cập nhật danh sách đã lọc
            this.applyFilters();

            // Hiển thị thông báo thành công
            this.notification.success(
              'Thành công',
              'Tạo sản phẩm vay mới thành công!',
              { nzDuration: 3000 }
            );

            // Tắt chế độ chỉnh sửa và đóng modal
            this.cancelEdit();
            this.closeModal();
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Lỗi khi tạo sản phẩm vay:', error);
          // Hiển thị thông báo lỗi
          this.notification.error(
            'Lỗi',
            'Đã xảy ra lỗi khi tạo sản phẩm vay. Chi tiết: ' + (error?.error?.message || error?.message || 'Không rõ lỗi'),
            { nzDuration: 5000 }
          );
          this.isSaving = false;
        }
      });
    } else {
      // Chế độ chỉnh sửa sản phẩm hiện có
      if (!this.selectedProduct) return;

      // Gọi API để cập nhật sản phẩm
      this.loanService.updateLoanProduct(this.selectedProduct.id, this.editingProduct).subscribe({
        next: (response) => {
          if (response && response.data) {
            // Cập nhật sản phẩm hiện tại
            this.selectedProduct = response.data;

            // Cập nhật sản phẩm trong danh sách
            const index = this.loanProducts.findIndex(p => p.id === this.selectedProduct!.id);
            if (index > -1) {
              this.loanProducts[index] = this.selectedProduct;
              // Cập nhật danh sách đã lọc
              this.applyFilters();
            }

            // Hiển thị thông báo thành công sử dụng NzNotificationService
            this.notification.success(
              'Thành công',
              'Cập nhật sản phẩm vay thành công!',
              { nzDuration: 3000 }
            );

            // Tắt chế độ chỉnh sửa
            this.cancelEdit();
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật sản phẩm vay:', error);
          // Hiển thị thông báo lỗi sử dụng NzNotificationService
          this.notification.error(
            'Lỗi',
            'Đã xảy ra lỗi khi cập nhật sản phẩm vay!',
            { nzDuration: 3000 }
          );

          this.isSaving = false;
        }
      });
    }
  }

  // Hủy chỉnh sửa
  cancelEdit(): void {
    this.isEditMode = false;
    this.isCreatingNew = false;
    this.editingProduct = {};
    this.selectedDocuments = [];
    this.showDocumentSelector = false;

    // Nếu đang tạo mới sản phẩm, đóng modal khi hủy
    if (this.isCreatingNew && this.isModalOpen) {
      this.closeModal();
    }
  }

  // Lọc danh sách tài liệu theo từ khóa tìm kiếm
  filterDocuments(searchTerm: string = ''): { key: string; value: string }[] {
    const term = searchTerm.toLowerCase().trim();

    // Chuyển đổi documentTypeDisplayMap thành mảng các cặp key-value
    const documents = Object.entries(this.documentTypeDisplayMap)
      .map(([key, value]) => ({ key, value }));

    if (!term) {
      return documents;
    }

    // Tìm kiếm theo mã hoặc tên hiển thị
    return documents.filter(doc =>
      doc.key.toLowerCase().includes(term) ||
      doc.value.toLowerCase().includes(term)
    );
  }

  // Xử lý tìm kiếm tài liệu khi gõ
  onDocumentSearchChange(): void {
    this.filteredDocumentTypes = this.filterDocuments(this.documentSearchTerm);
  }

  // Mở document selector và khởi tạo danh sách
  openDocumentSelector(): void {
    this.documentSearchTerm = '';
    this.filteredDocumentTypes = this.filterDocuments();
    this.showDocumentSelector = true;
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