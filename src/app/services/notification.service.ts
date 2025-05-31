import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private notification: NzNotificationService) { }

    /**
     * Hiển thị thông báo thành công
     * @param message Tiêu đề thông báo
     * @param description Nội dung thông báo
     */
    success(message: string, description: string = ''): void {
        this.notification.success(message, description);
    }

    /**
     * Hiển thị thông báo lỗi
     * @param message Tiêu đề thông báo
     * @param description Nội dung thông báo
     */
    error(message: string, description: string = ''): void {
        this.notification.error(message, description);
    }

    /**
     * Hiển thị thông báo cảnh báo
     * @param message Tiêu đề thông báo
     * @param description Nội dung thông báo
     */
    warning(message: string, description: string = ''): void {
        this.notification.warning(message, description);
    }

    /**
     * Hiển thị thông báo thông tin
     * @param message Tiêu đề thông báo
     * @param description Nội dung thông báo
     */
    info(message: string, description: string = ''): void {
        this.notification.info(message, description);
    }
}
