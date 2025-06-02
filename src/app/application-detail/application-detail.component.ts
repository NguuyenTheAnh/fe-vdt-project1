import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService, LoanApplication } from '../services/loan.service';
import { NotificationService } from '../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzModalService } from 'ng-zorro-antd/modal';

interface DocumentUpload {
  documentType: string;
  fileName: string | null;
  uploading: boolean;
  error: string | null;
  displayName: string;
}

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent implements OnInit {
  applicationId: number = 0;
  application: LoanApplication | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  parsedPersonalInfo: any = {};

  // Danh sách tài liệu yêu cầu
  requiredDocuments: DocumentUpload[] = [];

  // Map các mã tài liệu sang tên hiển thị
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
    'IMPORT_CONTRACT': 'Hợp đồng nhập khẩu'
  };

  // Các trạng thái của khoản vay
  statusTranslations: { [key: string]: string } = {
    'NEW': 'Mới',
    'UNDER_REVIEW': 'Đang xem xét',
    'APPROVED': 'Đã duyệt',
    'REJECTED': 'Từ chối',
    'CANCELLED': 'Đã hủy',
    'DISBURSED': 'Đã giải ngân'
  };

  // For formatting values
  formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private message: NzMessageService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.applicationId = +id;
        this.loadApplicationDetail();
      } else {
        this.router.navigate(['/borrower-portal/application-list']);
      }
    });
  }

  loadApplicationDetail(): void {
    this.isLoading = true;
    this.error = null;

    this.loanService.getApplicationById(this.applicationId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.application = response.data;

          // Parse personalInfo if it's a string
          if (this.application.personalInfo && typeof this.application.personalInfo === 'string') {
            try {
              this.parsedPersonalInfo = JSON.parse(this.application.personalInfo);
            } catch (e) {
              console.error('Error parsing personalInfo', e);
              this.parsedPersonalInfo = {};
            }
          }

          // Khởi tạo danh sách tài liệu yêu cầu
          this.initRequiredDocuments();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading application details', error);
        this.error = 'Không thể tải thông tin chi tiết đơn đăng ký. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Khởi tạo danh sách tài liệu yêu cầu từ sản phẩm vay
   */
  initRequiredDocuments(): void {
    if (this.application && this.application.loanProduct && this.application.loanProduct.requiredDocuments) {
      const documents = this.application.loanProduct.requiredDocuments.split(' ');

      this.requiredDocuments = documents.map(type => {
        return {
          documentType: type,
          fileName: null,
          uploading: false,
          error: null,
          displayName: this.documentTypeDisplayMap[type] || type
        };
      });
    }
  }

  /**
   * Format amount to Vietnamese currency
   */
  formatAmount(amount: number | null): string {
    if (amount === null) return 'N/A';
    return this.formatter.format(amount);
  }

  /**
   * Format date to Vietnamese format
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
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
   * Upload file handler
   */
  handleFileUpload(file: any, documentType: string): boolean {
    // Tìm document tương ứng
    const docIndex = this.requiredDocuments.findIndex(doc => doc.documentType === documentType);
    if (docIndex > -1) {
      this.requiredDocuments[docIndex].uploading = true;
      this.requiredDocuments[docIndex].error = null;

      // Tạo form data để upload
      const formData = new FormData();
      formData.append('file', file as any);

      // Gọi API upload file
      this.http.post(`${environment.apiUrl}/files/upload`, formData)
        .subscribe({
          next: (response: any) => {
            if (response && response.data && response.data.fileName) {
              // Upload thành công, lưu tên file và báo thành công
              this.requiredDocuments[docIndex].fileName = response.data.fileName;
              this.requiredDocuments[docIndex].uploading = false;

              // Thông báo thành công
              this.message.success(`Đã tải lên ${this.requiredDocuments[docIndex].displayName} thành công`);

              // Lưu thông tin document vào database
              this.saveDocumentToDatabase(documentType, response.data.fileName);
            }
          },
          error: (err) => {
            console.error('Error uploading file:', err);
            this.requiredDocuments[docIndex].uploading = false;
            this.requiredDocuments[docIndex].error = 'Lỗi khi tải lên tài liệu';

            // Thông báo lỗi
            this.message.error(`Không thể tải lên ${this.requiredDocuments[docIndex].displayName}`);
          }
        });
    }

    // Return false để ngăn upload mặc định của ng-zorro
    return false;
  }

  /**
   * Custom function to handle the upload button click
   */
  uploadDocument(doc: DocumentUpload, event: Event): void {
    event.preventDefault();
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Handle file selection
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        this.handleFileUpload(fileInput.files[0], doc.documentType);
      }
      document.body.removeChild(fileInput);
    });

    // Trigger file selection dialog
    fileInput.click();
  }

  /**
   * Lưu thông tin document vào database
   */
  saveDocumentToDatabase(documentType: string, fileName: string): void {
    const documentData = {
      applicationId: this.applicationId,
      documentType: documentType,
      fileName: fileName
    };

    this.http.post(`${environment.apiUrl}/documents`, documentData)
      .subscribe({
        next: (response: any) => {
          if (response && response.code === 1000) {
            this.message.success('Đã lưu thông tin tài liệu thành công');
          }
        },
        error: (err) => {
          console.error('Error saving document info:', err);
          this.message.error('Không thể lưu thông tin tài liệu');
        }
      });
  }

  /**
   * Get CSS class for application status
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'DISBURSED': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Quay lại trang trước đó
   */
  goBack(): void {
    this.router.navigate(['/borrower-portal/application-list']);
  }

  /**
   * Hủy hồ sơ vay - sử dụng Modal xác nhận
   */
  cancelApplication(): void {
    if (!this.application || !this.application.id) return;

    // Hiển thị modal xác nhận sử dụng NzModal
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy hồ sơ',
      nzContent: 'Bạn có chắc chắn muốn hủy hồ sơ vay này? Hành động này không thể hoàn tác.',
      nzOkText: 'Xác nhận hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Không, giữ lại',
      nzOnOk: () => {
        this.isLoading = true;

        // Ensure applicationId is defined
        if (this.application && this.application.id) {
          this.loanService.cancelApplication(this.application.id).subscribe({
            next: (response) => {
              if (response && response.code === 1000) {
                this.message.success('Đã hủy hồ sơ vay thành công');

                // Cập nhật trạng thái trên UI
                if (this.application) {
                  this.application.status = 'CANCELLED';
                }
              } else {
                this.message.error('Có lỗi xảy ra khi hủy hồ sơ vay');
              }
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error cancelling application:', err);
              this.message.error('Không thể hủy hồ sơ vay. Vui lòng thử lại sau.');
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  /**
   * Helper function for template to get keys of an object
   */
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
