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

            // Only subscribe to notifications when user is logged in
            if (user) {
                // Get initial unread count
                this.appNotificationService.getUnreadCount().subscribe();
            }
        });
        this.subscriptions.push(userSubscription);

        // Subscribe to unread notification count
        const notificationSubscription = this.appNotificationService.unreadCount$.subscribe(count => {
            this.unreadNotificationCount = count;
        });
        this.subscriptions.push(notificationSubscription);

        // Kiểm tra vị trí cuộn ban đầu
        this.isScrolled = window.scrollY > 30;
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to avoid memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    logout(): void {
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