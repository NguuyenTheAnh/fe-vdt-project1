import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserData } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AppNotificationService } from '../../services/app-notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
    currentUser: UserData | null = null;
    isLoggedIn = false;
    isAdmin = false;
    showMobileMenu = false;
    showUserDropdown = false;
    isScrolled = false;
    unreadNotificationCount = 0;
    private subscriptions: Subscription[] = [];
    private notificationSubscribed = false; // Flag để tránh duplicate subscription

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private router: Router,
        private appNotificationService: AppNotificationService
    ) { } ngOnInit(): void {
        // Subscribe để luôn cập nhật khi thông tin người dùng thay đổi
        const userSubscription = this.userService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;

            // Check if user is an admin
            this.isAdmin = !!(user && user.role && user.role.name === 'ADMIN');

            // Log để debug
            console.log('Header updated - User:', user?.fullName);
            console.log('Header updated - User role:', user?.role?.name);
            console.log('Header updated - isAdmin:', this.isAdmin);            // Only subscribe to notifications when user is logged in
            if (!user) {
                // Reset unread count và flag khi user logout
                this.unreadNotificationCount = 0;
                this.notificationSubscribed = false;
            }
        });
        this.subscriptions.push(userSubscription);

        // Subscribe to app initialization để chỉ load notifications khi app đã hoàn tất khởi tạo
        const appInitSubscription = this.userService.appInitialized$.subscribe(isInitialized => {
            if (isInitialized && this.currentUser && !this.notificationSubscribed) {
                // App đã khởi tạo xong và user đã login, bây giờ mới load notifications
                this.subscribeToNotifications();
            }
        });
        this.subscriptions.push(appInitSubscription);

        // Kiểm tra vị trí cuộn ban đầu
        this.isScrolled = window.scrollY > 30;
    } private subscribeToNotifications(): void {
        // Chỉ subscribe notifications cho role USER
        if (!this.currentUser || !this.currentUser.role || this.currentUser.role.name !== 'USER') {
            console.log('Not a USER role, skipping notification subscription');
            return;
        }

        // Đánh dấu đã subscribe để tránh duplicate
        this.notificationSubscribed = true;

        // Gọi API để lấy unread count chỉ cho USER
        this.appNotificationService.getUnreadCount().subscribe();

        // Subscribe to unread notification count changes
        const notificationSubscription = this.appNotificationService.unreadCount$.subscribe(count => {
            this.unreadNotificationCount = count;
        });
        this.subscriptions.push(notificationSubscription);
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to avoid memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    } logout(): void {
        // Reset notifications khi logout
        this.appNotificationService.resetUnreadCount();
        this.notificationSubscribed = false;

        this.authService.logout();
        this.router.navigate(['/login']);
    }

    toggleMobileMenu(): void {
        this.showMobileMenu = !this.showMobileMenu;
    } closeMobileMenu(): void {
        this.showMobileMenu = false;
    } toggleUserDropdown(): void {
        this.showUserDropdown = !this.showUserDropdown;

        // Thêm hoặc xóa class active trên nút dropdown
        const dropdownBtn = document.querySelector('.user-dropdown-btn');
        if (dropdownBtn) {
            if (this.showUserDropdown) {
                dropdownBtn.classList.add('active');
            } else {
                dropdownBtn.classList.remove('active');
            }
        }
    } closeUserDropdown(): void {
        this.showUserDropdown = false;

        // Xóa class active khi đóng dropdown
        const dropdownBtn = document.querySelector('.user-dropdown-btn');
        if (dropdownBtn) {
            dropdownBtn.classList.remove('active');
        }
    } @HostListener('window:scroll', [])
    onWindowScroll() {
        // Kiểm tra vị trí cuộn
        this.isScrolled = window.scrollY > 30;

        // Không cần thêm class vào body nữa vì padding được xử lý bởi main element
    }
}