import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserData } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  currentSection: string = 'Trang chủ';
  currentUser: UserData | null = null;
  showUserDropdown: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Lắng nghe sự kiện chuyển trang để cập nhật tiêu đề
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentSection();
      });
    this.subscriptions.push(routerSub);

    // Lắng nghe thông tin người dùng
    const userSub = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.subscriptions.push(userSub);

    // Khởi tạo tiêu đề ban đầu
    this.updateCurrentSection();
  }

  ngOnDestroy(): void {
    // Hủy subscription khi component bị hủy
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateCurrentSection(): void {
    const url = this.router.url;

    if (url.includes('/admin/main-dashboard')) {
      this.currentSection = 'Trang chủ';
    } else if (url.includes('/admin/role-list')) {
      this.currentSection = 'Quản lý vai trò';
    } else if (url.includes('/admin/user-list')) {
      this.currentSection = 'Quản lý người dùng';
    } else if (url.includes('/admin/loan-product-list')) {
      this.currentSection = 'Quản lý sản phẩm vay';
    } else if (url.includes('/admin/loan-application-list')) {
      this.currentSection = 'Quản lý đơn vay';
    } else if (url.includes('/admin/disbursement')) {
      this.currentSection = 'Quản lý giải ngân';
    } else if (url.includes('/admin/report')) {
      this.currentSection = 'Báo cáo';
    } else if (url.includes('/admin/system-config')) {
      this.currentSection = 'Cấu hình hệ thống';
    }
  }

  // Phương thức an toàn để lấy ký tự đầu tiên của tên
  getUserInitial(): string {
    if (this.currentUser?.fullName && this.currentUser.fullName.length > 0) {
      return this.currentUser.fullName.charAt(0).toUpperCase();
    }
    return 'A'; // Default là 'A' cho Admin
  }

  // Phương thức an toàn để lấy tên hiển thị
  getUserDisplayName(): string {
    if (!this.currentUser?.fullName) return 'Admin';

    return this.currentUser.fullName.length > 15
      ? this.currentUser.fullName.substring(0, 15) + '...'
      : this.currentUser.fullName;
  }

  // Phương thức để chuyển đổi trạng thái dropdown
  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  // Phương thức đóng dropdown
  closeUserDropdown(): void {
    this.showUserDropdown = false;
  }

  // Phương thức đăng xuất
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const dropdown = document.querySelector('.profile-dropdown');
    const dropdownBtn = document.querySelector('.profile-dropdown-btn');
    if (this.showUserDropdown && dropdown && dropdownBtn) {
      if (!dropdown.contains(event.target as Node) && !dropdownBtn.contains(event.target as Node)) {
        this.closeUserDropdown();
      }
    }
  }

  // Đóng dropdown khi nhấn phím ESC
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.showUserDropdown) {
      this.closeUserDropdown();
    }
  }
}
