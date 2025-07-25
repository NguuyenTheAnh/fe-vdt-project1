import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';

export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
    relatedEntityId?: number;
    relatedEntityType?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AppNotificationService {
    private unreadCount = 0;
    private unreadCountSubject = new BehaviorSubject<number>(0);

    // Observable that components can subscribe to
    public unreadCount$ = this.unreadCountSubject.asObservable(); constructor(private apiService: ApiService) {
        // Không tự động gọi getUnreadCount() ở đây nữa
        // Sẽ được gọi từ component khi user đăng nhập
    }

    /**
     * Lấy danh sách thông báo của người dùng
     */
    getNotifications(page: number = 1, limit: number = 10): Observable<ApiResponse<Notification[]>> {
        return this.apiService.get<Notification[]>('/notifications', { page, limit });
    }    /**
     * Lấy số lượng thông báo chưa đọc
     */
    getUnreadCount(): Observable<ApiResponse<number>> {
        return this.apiService.get<number>('/notifications/unread-count')
            .pipe(
                tap(response => {
                    if (response.code === 1000) {
                        // API trả về data là số lượng unread trực tiếp, không phải object
                        this.unreadCount = response.data || 0;
                        this.unreadCountSubject.next(this.unreadCount);
                    }
                }),                // Handle lỗi khi role không được phép
                catchError((error: any) => {
                    if (error.status === 403 || error.status === 404) {
                        console.log('User not authorized for notifications, setting count to 0');
                        this.unreadCount = 0;
                        this.unreadCountSubject.next(0);
                        // Trả về observable giả để không break chain
                        return of({ code: 1000, data: 0, message: 'Not authorized' } as ApiResponse<number>);
                    }
                    throw error;
                })
            );
    }

    /**
     * Đánh dấu thông báo đã đọc
     */
    markAsRead(notificationId: number): Observable<ApiResponse<void>> {
        return this.apiService.patch<void>(`/notifications/${notificationId}/read`, {})
            .pipe(
                tap(response => {
                    if (response.code === 1000 && this.unreadCount > 0) {
                        this.unreadCount--;
                        this.unreadCountSubject.next(this.unreadCount);
                    }
                })
            );
    }    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    markAllAsRead(): Observable<ApiResponse<void>> {
        return this.apiService.post<void>('/notifications/mark-all-as-read', {})
            .pipe(
                tap(response => {
                    if (response.code === 1000) {
                        this.unreadCount = 0;
                        this.unreadCountSubject.next(this.unreadCount);
                    }
                })
            );
    }

    /**
     * Xóa một thông báo
     */
    deleteNotification(notificationId: number): Observable<ApiResponse<void>> {
        return this.apiService.delete<void>(`/notifications/${notificationId}`);
    }    /**
     * Lấy số lượng thông báo chưa đọc từ bộ nhớ cache
     */
    getCachedUnreadCount(): number {
        return this.unreadCount;
    }

    /**
     * Cập nhật số lượng thông báo chưa đọc theo số lượng cụ thể
     */
    updateUnreadCount(count: number): void {
        this.unreadCount = count;
        this.unreadCountSubject.next(this.unreadCount);
    }

    /**
     * Tăng số lượng thông báo chưa đọc khi có một thông báo mới
     */
    incrementUnreadCount(): void {
        this.unreadCount++;
        this.unreadCountSubject.next(this.unreadCount);
    }

    /**
     * Giảm số lượng thông báo chưa đọc
     */
    decrementUnreadCount(): void {
        if (this.unreadCount > 0) {
            this.unreadCount--;
            this.unreadCountSubject.next(this.unreadCount);
        }
    }

    /**
     * Reset unread count khi user logout
     */
    resetUnreadCount(): void {
        this.unreadCount = 0;
        this.unreadCountSubject.next(0);
    }
}
