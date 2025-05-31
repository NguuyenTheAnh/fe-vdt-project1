import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

    constructor(private apiService: ApiService) { }

    /**
     * Lấy danh sách thông báo của người dùng
     */
    getNotifications(page: number = 1, limit: number = 10): Observable<ApiResponse<Notification[]>> {
        return this.apiService.get<Notification[]>('/notifications', { page, limit });
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
        return this.apiService.get<{ count: number }>('/notifications/unread-count')
            .pipe(
                tap(response => {
                    if (response.code === 1000 && response.data) {
                        this.unreadCount = response.data.count;
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
                    }
                })
            );
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    markAllAsRead(): Observable<ApiResponse<void>> {
        return this.apiService.patch<void>('/notifications/mark-all-read', {})
            .pipe(
                tap(response => {
                    if (response.code === 1000) {
                        this.unreadCount = 0;
                    }
                })
            );
    }

    /**
     * Xóa một thông báo
     */
    deleteNotification(notificationId: number): Observable<ApiResponse<void>> {
        return this.apiService.delete<void>(`/notifications/${notificationId}`);
    }

    /**
     * Lấy số lượng thông báo chưa đọc từ bộ nhớ cache
     */
    getCachedUnreadCount(): number {
        return this.unreadCount;
    }
}
