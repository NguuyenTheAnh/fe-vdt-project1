import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserData } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    currentUser: UserData | null = null;
    isLoggedIn = false;
    showMobileMenu = false;
    showUserDropdown = false;
    isScrolled = false;

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private router: Router
    ) { } ngOnInit(): void {
        // Subscribe để luôn cập nhật khi thông tin người dùng thay đổi
        this.userService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;
        });

        // Kiểm tra vị trí cuộn ban đầu
        this.isScrolled = window.scrollY > 30;
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