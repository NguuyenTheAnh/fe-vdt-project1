import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserService } from './services/user.service';
import { filter } from 'rxjs/operators';

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
    console.log('App initializing...');

    // Khởi tạo thông tin người dùng từ localStorage trước
    this.userService.initializeFromLocalStorage();

    // Theo dõi sự thay đổi router để cập nhật trạng thái header
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Logic xử lý khi route thay đổi có thể được thêm vào đây nếu cần
    });

    // Sau đó gọi API lấy thông tin profile mới nhất nếu có token
    const authToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (authToken) {
      console.log('Found auth token, validating...');

      // Nếu có token và có thông tin người dùng trong localStorage, sử dụng nó trước
      if (storedUser) {
        console.log('Using stored user data while validating token');
      }

      // Cố gắng lấy thông tin người dùng mới nhất và xác thực token
      this.userService.fetchCurrentUserProfile().subscribe({
        next: (userData) => {
          if (userData) {
            console.log('Authentication validated successfully');
          } else {
            console.warn('Could not validate authentication, user data is null');

            // Nếu không lấy được dữ liệu và không có dữ liệu cũ, xóa token
            if (!storedUser) {
              console.warn('No stored user found, removing auth token');
              localStorage.removeItem('authToken');
            }
          }
        },
        error: (err) => {
          console.error('Error fetching user profile:', err);

          // Xử lý lỗi xác thực cụ thể
          if (err.status === 401 || err.status === 403) {
            console.warn('Authentication error, clearing credentials');
            localStorage.removeItem('authToken');
            this.userService.clearCurrentUser();

            // Nếu không ở trang login hoặc register, chuyển hướng về trang login
            if (!this.router.url.includes('/login') && !this.router.url.includes('/register')) {
              this.router.navigate(['/login']);
            }
          }
        }
      });
    }
  }
}
