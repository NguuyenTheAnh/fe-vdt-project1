import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private apiService: ApiService) {
        // Initialize by fetching unread count
        this.getUnreadCount().subscribe();
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
}
