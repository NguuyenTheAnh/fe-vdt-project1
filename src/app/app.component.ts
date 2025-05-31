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

    // Sau đó gọi API lấy thông tin profile mới nhất nếu có token
    const authToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (authToken) {
      console.log('Found auth token, validating...');

      // Nếu có token và có thông tin người dùng trong localStorage, sử dụng nó trước
      if (storedUser) {
        console.log('Using stored user data while validating token');
      }

      // Cố gắng lấy thông tin người dùng mới nhất
      this.userService.fetchCurrentUserProfile().subscribe({
        next: (userData) => {
          if (userData) {
            console.log('Authentication validated successfully');
          } else {
            console.warn('Could not validate authentication, user data is null');

            // Nếu không lấy được dữ liệu mới nhưng có dữ liệu cũ, giữ nguyên dữ liệu cũ
            if (!storedUser) {
              console.warn('No stored user found, removing auth token');
              localStorage.removeItem('authToken');
            }
          }
        },
        error: (err) => {
          console.error('Error fetching user profile:', err);
          // Xử lý lỗi cụ thể nếu cần
          if (err.status === 401) {
            localStorage.removeItem('authToken');
            this.userService.clearCurrentUser();
          }
        }
      });
    }
  }
}
