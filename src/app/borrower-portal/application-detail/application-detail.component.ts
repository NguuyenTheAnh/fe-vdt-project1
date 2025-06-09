import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService, LoanApplication } from '../../services/loan.service';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DocumentService, Document } from '../../services/document.service';
import { ApiService } from '../../services/api.service';
import { LoanApplicationStatus } from '../../services/application.service';
import { SystemConfigService, RequiredDocumentsConfig } from '../../services/system-config.service';

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

    // Expose enum to template
    LoanApplicationStatus = LoanApplicationStatus;    // Danh sách tài liệu yêu cầu
    requiredDocuments: DocumentUpload[] = [];

    // Map các mã tài liệu sang tên hiển thị (sẽ được tải từ SystemConfigService)
    documentTypeDisplayMap: { [key: string]: string } = {};

    // Các trạng thái của khoản vay
    statusTranslations: { [key: string]: string } = {
        'NEW': 'Mới',
        'PENDING': 'Chờ xét duyệt',
        'UNDER_REVIEW': 'Đang xem xét',
        'APPROVED': 'Đã duyệt',
        'REJECTED': 'Từ chối', 'CANCELLED': 'Đã hủy',
        'PARTIALLY_DISBURSED': 'Giải ngân một phần',
        'FULLY_DISBURSED': 'Đã giải ngân hoàn tất'
    };

    // For formatting values
    formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }); constructor(
        private route: ActivatedRoute,
        private router: Router,
        private loanService: LoanService,
        private notificationService: NotificationService,
        private http: HttpClient,
        private message: NzMessageService,
        private modal: NzModalService,
        private documentService: DocumentService,
        private apiService: ApiService,
        private configService: SystemConfigService
    ) { } ngOnInit(): void {
        // Load document types first
        this.loadDocumentTypes();

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

                    // Khởi tạo danh sách tài liệu yêu cầu từ API
                    // Hàm này sẽ tự động lấy thông tin tài liệu đã upload và chưa upload
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
     * Load document types from SystemConfigService
     */
    async loadDocumentTypes(): Promise<void> {
        try {
            this.documentTypeDisplayMap = await this.configService.getRequiredDocuments();
        } catch (error) {
            console.error('Error loading document types:', error);
            // Keep empty map as fallback
            this.documentTypeDisplayMap = {};
        }
    }

    /**
     * Khởi tạo danh sách tài liệu yêu cầu từ API
     */
    initRequiredDocuments(): void {
        if (this.application && this.application.id) {
            this.loanService.getRequiredDocuments(this.application.id).subscribe({
                next: (response) => {
                    if (response && response.code === 1000 && response.data) {
                        // Chuyển đổi từ object sang array để hiển thị trong template
                        const documentData = response.data;
                        this.requiredDocuments = Object.keys(documentData).map(type => {
                            return {
                                documentType: type,
                                fileName: documentData[type], // Nếu đã upload sẽ có tên file, ngược lại là null
                                uploading: false,
                                error: null,
                                displayName: this.documentTypeDisplayMap[type] || type
                            };
                        });
                    }
                },
                error: (error) => {
                    console.error('Error loading required documents', error);

                    // Fallback to product documents if API fails
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
            });
        }
    }

    /**
     * Format amount to Vietnamese currency
     */
    formatAmount(amount: number | null): string {
        if (amount === null || amount === undefined) return 'N/A';
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

            if (!this.applicationId) {
                console.error('Application ID not found');
                this.requiredDocuments[docIndex].uploading = false;
                return false;
            }

            // Kiểm tra xem đây là thao tác tạo mới hay cập nhật
            const isUpdate = this.requiredDocuments[docIndex].fileName !== null;

            // Sử dụng DocumentService để tải file lên
            this.documentService.uploadDocument(this.applicationId, documentType, file)
                .subscribe({
                    next: (response: any) => {
                        if (response && response.code === 1000 && response.data && response.data.fileName) {
                            const fileName = response.data.fileName;

                            // Dựa vào trạng thái hiện tại để quyết định tạo mới hay cập nhật
                            const documentAction = isUpdate
                                ? this.documentService.updateDocument(this.applicationId, documentType, fileName)
                                : this.documentService.saveDocument(this.applicationId, documentType, fileName);

                            // Thực hiện lưu hoặc cập nhật thông tin document
                            documentAction.subscribe({
                                next: (saveResponse: any) => {
                                    if (saveResponse && saveResponse.code === 1000) {
                                        // Cập nhật UI tạm thời
                                        this.requiredDocuments[docIndex].fileName = fileName;
                                        this.requiredDocuments[docIndex].uploading = false;

                                        // Thông báo thành công
                                        const action = isUpdate ? 'cập nhật' : 'tải lên';
                                        this.notificationService.success(
                                            'Thành công',
                                            `Đã ${action} ${this.requiredDocuments[docIndex].displayName} thành công`
                                        );

                                        // Gọi API để lấy lại danh sách tài liệu yêu cầu mới nhất
                                        // Điều này sẽ đảm bảo trạng thái chính xác của tất cả các tài liệu
                                        this.initRequiredDocuments();
                                    } else {
                                        this.handleUploadError(docIndex, `${isUpdate ? 'Cập nhật' : 'Lưu'} thông tin tài liệu thất bại`);
                                    }
                                },
                                error: (err) => {
                                    console.error(`Error ${isUpdate ? 'updating' : 'saving'} document info:`, err);
                                    this.handleUploadError(docIndex, `Không thể ${isUpdate ? 'cập nhật' : 'lưu'} thông tin tài liệu`);
                                }
                            });
                        } else {
                            this.handleUploadError(docIndex, 'Tải file lên thất bại');
                        }
                    },
                    error: (err) => {
                        console.error('Error uploading file:', err);
                        this.handleUploadError(docIndex, 'Không thể tải lên tài liệu');
                    }
                });
        }

        // Return false để ngăn upload mặc định của ng-zorro
        return false;
    }

    /**
     * Check if all required documents are uploaded
     * @returns boolean indicating if all documents are uploaded
     */
    areAllDocumentsUploaded(): boolean {
        // If requiredDocuments array is empty or undefined, return false
        if (!this.requiredDocuments || this.requiredDocuments.length === 0) {
            return false;
        }

        // Check if all documents have a fileName (not null)
        return this.requiredDocuments.every(doc => doc.fileName !== null);
    }

    /**
     * Helper method to handle upload errors
     */
    private handleUploadError(docIndex: number, errorMessage: string): void {
        this.requiredDocuments[docIndex].uploading = false;
        this.requiredDocuments[docIndex].error = errorMessage;
        this.notificationService.error(
            'Lỗi tải lên tài liệu',
            `Không thể tải lên ${this.requiredDocuments[docIndex].displayName}: ${errorMessage}`
        );
    }

    /**
     * Custom function to handle the upload button click
     */
    uploadDocument(doc: DocumentUpload, event: Event): void {
        event.preventDefault();        // Don't allow document uploads if application is not in NEW status
        if (this.application && this.application.status !== LoanApplicationStatus.NEW) {
            this.notificationService.warning(
                'Không thể cập nhật',
                'Không thể cập nhật tài liệu sau khi hồ sơ đã được gửi yêu cầu xét duyệt'
            );
            return;
        }

        // Don't proceed if document is already being uploaded
        if (doc.uploading) {
            return;
        }

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
     * Get appropriate tooltip for document button based on application status and document state
     */    getDocumentButtonTooltip(doc: DocumentUpload): string {
        if (this.application && this.application.status !== LoanApplicationStatus.NEW) {
            return 'Không thể cập nhật tài liệu sau khi hồ sơ đã được gửi yêu cầu xét duyệt';
        }

        return doc.fileName ? 'Cập nhật tài liệu hiện tại' : 'Tải lên tài liệu mới';
    }

    /**
     * Get CSS class for application status
     */    getStatusClass(status: string): string {
        switch (status) {
            case LoanApplicationStatus.NEW: return 'bg-blue-100 text-blue-800 border-blue-200';
            case LoanApplicationStatus.PENDING: return 'bg-orange-100 text-orange-800 border-orange-200';
            case LoanApplicationStatus.REQUIRE_MORE_INFO: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; case LoanApplicationStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-200';
            case LoanApplicationStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200';
            case LoanApplicationStatus.PARTIALLY_DISBURSED: return 'bg-purple-100 text-purple-800 border-purple-200';
            case LoanApplicationStatus.FULLY_DISBURSED: return 'bg-purple-100 text-purple-800 border-purple-200';
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
                this.isLoading = true;                                // Ensure applicationId is defined
                if (this.application && this.application.id) {
                    this.loanService.cancelApplication(this.application.id).subscribe({
                        next: (response) => {
                            if (response && response.code === 1000) {
                                // Cập nhật trạng thái trên UI
                                if (this.application) {
                                    this.application.status = LoanApplicationStatus.REJECTED;
                                }
                            } else {
                                console.error('Error response when cancelling application:', response);
                            }
                            this.isLoading = false;
                        },
                        error: (err) => {
                            console.error('Error cancelling application:', err);
                            this.isLoading = false;
                        }
                    });
                }
            }
        });
    }

    /**
     * Request application review
     * This function will:
     * 1. Send a notification to admin about the review request
     * 2. Update the application status to "PENDING"
     * 3. Update the UI accordingly
     */
    requestApplicationReview(): void {
        if (!this.application || !this.application.id) {
            this.notificationService.error('Lỗi', 'Không thể xác định thông tin hồ sơ');
            return;
        }

        // Check if all required documents are uploaded
        if (!this.areAllDocumentsUploaded()) {
            this.notificationService.warning(
                'Chưa đủ điều kiện',
                'Vui lòng tải lên tất cả các tài liệu yêu cầu trước khi gửi yêu cầu duyệt hồ sơ.'
            );
            return;
        }

        this.isLoading = true;

        // Show confirmation dialog
        this.modal.confirm({
            nzTitle: 'Xác nhận yêu cầu duyệt hồ sơ',
            nzContent: 'Sau khi gửi yêu cầu duyệt, hồ sơ của bạn sẽ được chuyển đến nhân viên xét duyệt. Bạn có chắc chắn muốn tiếp tục?',
            nzOkText: 'Xác nhận gửi',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                // 1. Create notification for admin review
                const notificationPayload = {
                    applicationId: this.applicationId,
                    message: `Cấc tài liệu cần thiết đã được tải lên. Hồ sơ vay của bạn đang chờ xét duyệt.`,
                    notificationType: 'REVIEWING',
                };                // Use the API service directly to create a notification
                this.apiService.post<any>('/notifications', notificationPayload)
                    .subscribe({
                        next: () => {                            // 2. Update application status to "PENDING" using new API
                            this.loanService.updateApplicationStatus(this.application!.id!, LoanApplicationStatus.PENDING)
                                .subscribe({
                                    next: (response) => {
                                        if (response && response.code === 1000) {
                                            // Update local application object
                                            if (this.application) {
                                                this.application.status = LoanApplicationStatus.PENDING;
                                            }

                                            // Show success message
                                            this.notificationService.success(
                                                'Gửi hồ sơ thành công',
                                                'Hồ sơ của bạn đã được gửi cho nhân viên xét duyệt. Chúng tôi sẽ thông báo kết quả sớm nhất.'
                                            );

                                            // Create a loading message element
                                            const loadingMessage = document.createElement('div');
                                            loadingMessage.innerHTML = `
                        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                    background-color: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
                                    justify-content: center; align-items: center;">
                          <div style="background-color: white; padding: 30px; border-radius: 10px; 
                                      text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            <div class="animate-spin rounded-full h-10 w-10 border-4 border-t-[#E74C3C] mx-auto mb-4"></div>
                            <p style="font-size: 18px; color: #333; margin: 0;">Đang tải lại trang...</p>
                          </div>
                        </div>
                      `;
                                            document.body.appendChild(loadingMessage);

                                            // Set timeout to reload page after 1 second
                                            // This will update the notification counter in the header
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 1000);
                                        } else {
                                            // Show error message
                                            this.notificationService.error(
                                                'Lỗi cập nhật trạng thái',
                                                'Không thể cập nhật trạng thái hồ sơ. Vui lòng thử lại sau.'
                                            );
                                            this.isLoading = false;
                                        }
                                        this.isLoading = false;
                                    },
                                    error: (error: any) => {
                                        console.error('Error updating application status:', error);
                                        this.notificationService.error(
                                            'Lỗi cập nhật trạng thái',
                                            'Đã xảy ra lỗi khi cập nhật trạng thái hồ sơ. Vui lòng thử lại sau.'
                                        );
                                        this.isLoading = false;
                                    }
                                });
                        },
                        error: (error: any) => {
                            console.error('Error creating notification:', error);
                            this.notificationService.error(
                                'Lỗi gửi thông báo',
                                'Đã xảy ra lỗi khi gửi thông báo cho nhân viên xét duyệt. Vui lòng thử lại sau.'
                            );
                            this.isLoading = false;
                        }
                    });
            },
            nzOnCancel: () => {
                this.isLoading = false;
            }
        });
    }

    /**
     * Helper function for template to get keys of an object
     */
    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }

    /**
     * Get document URL for downloading
     */
    getDocumentUrl(fileName: string | null): string {
        if (!fileName) return '';
        return `${environment.apiUrl}/uploads/${fileName}`;
    }
}
