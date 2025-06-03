import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NzNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [true]
    });
  }

  submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginData: LoginRequest = {
        email: this.loginForm.get('email')?.value || '',
        password: this.loginForm.get('password')?.value || ''
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.code === 1000 && response.data) {
            // Hiển thị thông báo thành công
            this.notification.success(
              'Đăng nhập thành công',
              'Chào mừng bạn quay trở lại!'
            );

            // Đợi quá trình khởi tạo app hoàn tất và thông tin người dùng được tải đầy đủ
            // Chờ một chút để đảm bảo fetchCurrentUserProfile đã hoàn thành
            setTimeout(() => {
              this.authService.getUserService().appInitialized$.subscribe((isInitialized: boolean) => {
                if (isInitialized) {
                  console.log('App initialized and user role loaded, navigating to home');
                  this.router.navigate(['/home']);
                }
              });
            }, 500);
          } else {
            this.notification.error(
              'Đăng nhập thất bại',
              response.message || 'Email hoặc mật khẩu không chính xác.'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          this.notification.error(
            'Đăng nhập thất bại',
            'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.'
          );
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}