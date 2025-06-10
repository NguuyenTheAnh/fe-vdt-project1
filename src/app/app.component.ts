import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(
    private userService: UserService,
    public router: Router
  ) { }

  ngOnInit(): void {
    // Đánh dấu trạng thái đang khởi tạo
    this.userService.setAppInitialized(false);

    // Khởi tạo thông tin người dùng từ localStorage trước
    this.userService.initializeFromLocalStorage();

    // Sau đó gọi API lấy thông tin profile mới nhất nếu có token
    const authToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (authToken) {
      // Nếu có token và có thông tin người dùng trong localStorage, sử dụng nó trước
      // Cố gắng lấy thông tin người dùng mới nhất và xác thực token
      this.userService.fetchCurrentUserProfile().subscribe({
        next: (userData) => {
          if (userData) {
            // AdminGuard sẽ xử lý việc kiểm tra quyền truy cập admin routes
          } else {
            // Nếu không lấy được dữ liệu và không có dữ liệu cũ, xóa token
            if (!storedUser) {
              localStorage.removeItem('authToken');
            }
          }

          // Đánh dấu quá trình khởi tạo đã hoàn tất
          this.userService.setAppInitialized(true);
        },
        error: (err) => {
          // Xử lý lỗi xác thực cụ thể
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem('authToken');
            this.userService.clearCurrentUser();

            // Nếu không ở trang login hoặc register, chuyển hướng về trang login
            if (!this.router.url.includes('/login') && !this.router.url.includes('/register')) {
              this.router.navigate(['/login']);
            }
          }

          // Đánh dấu quá trình khởi tạo đã hoàn tất ngay cả khi có lỗi
          this.userService.setAppInitialized(true);
        }
      });
    } else {
      // Nếu không có token, đánh dấu khởi tạo đã hoàn tất ngay
      this.userService.setAppInitialized(true);
    }
  }
}
