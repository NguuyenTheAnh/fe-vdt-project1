import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';
import { PageableResponse } from './loan.service';

export interface UserNotification {
    id: number;
    message: string;
    isRead: boolean;
    notificationType: string;
    createdAt: string;
    user: any;
    loanApplication?: any;
    expanded?: boolean; // UI state for expanded view
}

@Injectable({
    providedIn: 'root'
})
export class UserNotificationService {
    constructor(private apiService: ApiService) { }    /**
     * Lấy danh sách thông báo của người dùng
     * @param page Số trang
     * @param size Số lượng thông báo mỗi trang
     * @param sort Trường sắp xếp và hướng sắp xếp (mặc định là createdAt,desc)
     * @returns Danh sách thông báo theo trang
     */
    getNotifications(page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Observable<ApiResponse<PageableResponse<UserNotification>>> {
        return this.apiService.get<PageableResponse<UserNotification>>(`/notifications?page=${page}&size=${size}&sort=${sort}`);
    }

    /**
     * Cập nhật thông báo
     * @param id ID của thông báo
     * @param data Dữ liệu cập nhật
     * @returns Kết quả cập nhật
     */
    updateNotification(id: number, data: any): Observable<ApiResponse<any>> {
        return this.apiService.patch<any>(`/notifications/${id}`, data);
    }

    /**
     * Đánh dấu thông báo đã đọc
     * @param id ID của thông báo
     * @returns Kết quả đánh dấu
     */
    markAsRead(id: number): Observable<ApiResponse<any>> {
        return this.apiService.patch<any>(`/notifications/${id}/read`, {});
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     * @returns Kết quả đánh dấu
     */
    markAllAsRead(): Observable<ApiResponse<any>> {
        return this.apiService.patch<any>(`/notifications/read-all`, {});
    }

    /**
     * Xóa thông báo
     * @param id ID của thông báo
     * @returns Kết quả xóa
     */
    deleteNotification(id: number): Observable<ApiResponse<any>> {
        return this.apiService.delete<any>(`/notifications/${id}`);
    }
}
