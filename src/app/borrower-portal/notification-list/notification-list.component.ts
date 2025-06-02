import { Component, OnInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { UserNotificationService, UserNotification } from '../../services/user-notification.service';
import { NotificationService } from '../../services/notification.service';
import { AppNotificationService } from '../../services/app-notification.service';
import { LoanService } from '../../services/loan.service';
import { ApiService } from '../../services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: [
    './notification-list.component.css',
    './modal-fix.css'
  ],
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
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: UserNotification[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  unreadCount: number = 0;

  // Make Math available in the template
  Math = Math;

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;

  // Modal properties
  isModalOpen: boolean = false;
  selectedApplication: any = null;
  isLoadingApplication: boolean = false;
  applicationError: string | null = null;

  constructor(
    private userNotificationService: UserNotificationService,
    private notificationService: NotificationService,
    private appNotificationService: AppNotificationService,
    private loanService: LoanService,
    private router: Router,
    private renderer: Renderer2,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();

    // Ensure any leftover modal-open class is removed
    this.renderer.removeClass(document.body, 'modal-open');
  }

  ngOnDestroy(): void {
    // Clean up any modal-related body classes when component is destroyed
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.setStyle(document.body, 'overflow', 'auto');
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = null;

    this.userNotificationService.getNotifications(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.notifications = response.data.content.map(notification => ({
            ...notification,
            expanded: false // Add UI state for expanded view
          }));

          // Update pagination info
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;

          // Calculate unread count
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;

          // Update the shared notification count
          this.appNotificationService.updateUnreadCount(this.unreadCount);

          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading notifications', error);
        this.error = 'Không thể tải thông báo. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  } toggleNotification(notification: UserNotification): void {
    // Toggle expanded state
    notification.expanded = !notification.expanded;

    // If notification is not read, mark it as read
    if (!notification.isRead) {
      this.userNotificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);

          // Also update the shared unread count
          this.appNotificationService.updateUnreadCount(this.unreadCount);
        },
        error: (error) => {
          console.error('Error marking notification as read', error);
        }
      });
    }

    // Force layout recalculation to ensure smooth animation
    setTimeout(() => {
      // Manually trigger detection for all notifications
      this.notifications = [...this.notifications];

      // Force browser to recognize the expanded state properly
      window.dispatchEvent(new Event('resize'));

      // Additional DOM recalculation hack for problematic browsers
      const element = document.querySelector('.notification-container');
      if (element) {
        element.classList.add('force-reflow');
        setTimeout(() => element.classList.remove('force-reflow'), 50);
      }
    }, 50);
  }

  deleteNotification(id: number): void {
    this.isLoading = true;
    this.userNotificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);

        // Recalculate unread count
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;

        // Update the shared unread count
        this.appNotificationService.updateUnreadCount(this.unreadCount);

        this.notificationService.success('Xóa thành công', 'Thông báo đã được xóa.');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting notification', error);
        this.notificationService.error('Xóa thất bại', 'Không thể xóa thông báo. Vui lòng thử lại sau.');
        this.isLoading = false;
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.isLoading = true;
    this.apiService.post<any>('/notifications/mark-all-as-read', {}).subscribe({
      next: () => {
        // Update all notifications to read
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;

        // Update the shared unread count
        this.appNotificationService.updateUnreadCount(0);

        this.notificationService.success('Đánh dấu thành công', 'Tất cả thông báo đã được đánh dấu là đã đọc.');

        // Reload the page to refresh the notifications list
        window.location.reload();
      },
      error: (error: any) => {
        console.error('Error marking all notifications as read', error);
        this.notificationService.error('Đánh dấu thất bại', 'Không thể đánh dấu tất cả thông báo. Vui lòng thử lại sau.');
        this.isLoading = false;
      }
    });
  }

  viewLoanApplication(applicationId: number): void {
    // Open modal with application details instead of navigating
    this.openApplicationModal(applicationId);
  } openApplicationModal(applicationId: number): void {
    this.isLoadingApplication = true;
    this.applicationError = null;
    this.selectedApplication = null;

    // Open modal immediately for better UX
    this.isModalOpen = true;

    // Use renderer for DOM manipulations
    this.renderer.setStyle(document.body, 'overflow', 'hidden'); // Prevent background scrolling

    // Thêm class cho body để có thể styling dựa trên trạng thái modal
    this.renderer.addClass(document.body, 'modal-open');

    // Cuộn trang lên trên cùng để đảm bảo modal hiển thị từ đầu
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.loanService.getApplicationById(applicationId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.selectedApplication = response.data;

          // Parse personalInfo if it's a JSON string
          if (this.selectedApplication.personalInfo && typeof this.selectedApplication.personalInfo === 'string') {
            try {
              this.selectedApplication.parsedPersonalInfo = JSON.parse(this.selectedApplication.personalInfo);
            } catch (e) {
              console.error('Error parsing personalInfo', e);
              this.selectedApplication.parsedPersonalInfo = {};
            }
          }

          // Tìm tất cả thông báo tương ứng với đơn hàng này và đánh dấu đã đọc nếu chưa đọc
          const relatedNotifications = this.notifications.filter(n =>
            n.loanApplication && n.loanApplication.id === applicationId && !n.isRead
          );

          if (relatedNotifications.length > 0) {
            console.log(`Marking ${relatedNotifications.length} notifications as read`);
            relatedNotifications.forEach(notification => {
              this.markNotificationAsReadViaAPI(notification);
            });
          }
        }
        this.isLoadingApplication = false;
      },
      error: (error) => {
        console.error('Error loading application details', error);
        this.applicationError = 'Không thể tải thông tin chi tiết đơn đăng ký. Vui lòng thử lại sau.';
        this.isLoadingApplication = false;
      }
    });
  }  // Đánh dấu thông báo đã đọc thông qua API PATCH
  markNotificationAsReadViaAPI(notification: UserNotification): void {
    if (notification.isRead) return;

    const updateData = {
      applicationId: notification.loanApplication?.id,
      message: notification.message,
      notificationType: notification.notificationType,
      isRead: true
    };

    this.userNotificationService.updateNotification(notification.id, updateData).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        console.log('Notification marked as read successfully:', notification.id);
      },
      error: (error) => {
        console.error('Error updating notification as read', error);
        this.notificationService.error('Có lỗi xảy ra', 'Không thể cập nhật trạng thái thông báo.');
      }
    });
  } closeModal(): void {
    this.isModalOpen = false;

    // Use renderer for DOM manipulations
    this.renderer.setStyle(document.body, 'overflow', 'auto'); // Re-enable scrolling

    // Xóa class khỏi body khi đóng modal
    this.renderer.removeClass(document.body, 'modal-open');

    // Khôi phục vị trí cuộn trang nếu cần
    setTimeout(() => {
      // Đợi animation kết thúc rồi mới thực hiện
      if (!this.isModalOpen) {
        // Giữ nguyên vị trí cuộn trang - không thay đổi
      }
    }, 300);

    // Add a small delay before clearing the selected application to avoid UI flicker
    setTimeout(() => {
      if (!this.isModalOpen) {
        this.selectedApplication = null;
      }
    }, 200);

    // Tải lại danh sách thông báo để cập nhật trạng thái đã đọc
    this.loadNotifications();

    // Hiển thị thông báo thành công
    this.notificationService.success('Cập nhật thành công', 'Thông tin đã được cập nhật.');
  }

  // Close modal when pressing Escape key
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isModalOpen) {
      this.closeModal();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getNotificationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'DOCUMENT_REQUEST': 'Yêu cầu tài liệu',
      'LOAN_APPROVAL': 'Phê duyệt khoản vay',
      'LOAN_REJECTION': 'Từ chối khoản vay',
      'SYSTEM': 'Thông báo hệ thống'
    };

    return labels[type] || 'Thông báo';
  }

  getNotificationTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'DOCUMENT_REQUEST': 'bg-blue-100 text-blue-600',
      'LOAN_APPROVAL': 'bg-green-100 text-green-600',
      'LOAN_REJECTION': 'bg-red-100 text-red-600',
      'SYSTEM': 'bg-gray-100 text-gray-600'
    };

    return classes[type] || 'bg-gray-100 text-gray-600';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'NEW': 'Mới',
      'PENDING': 'Đang chờ',
      'REQUIRE_MORE_INFO': 'Cần thêm thông tin',
      'APPROVED': 'Đã phê duyệt',
      'REJECTED': 'Từ chối',
      'DISBURSED': 'Đã giải ngân',
    };

    return labels[status] || status;
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  getPaginationRange(): (number | string)[] {
    const result: (number | string)[] = [];
    const currentPage = this.currentPage + 1; // Convert to 1-based for display
    const totalPages = this.totalPages;

    // Always show first page
    result.push(1);

    // Show "..." if current page > 3
    if (currentPage > 3) {
      result.push('...');
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      // Avoid duplicates with first or last page
      if (i !== 1 && i !== totalPages) {
        result.push(i);
      }
    }

    // Show "..." if current page < totalPages - 2
    if (currentPage < totalPages - 2) {
      result.push('...');
    }

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      result.push(totalPages);
    }

    return result;
  }
}
