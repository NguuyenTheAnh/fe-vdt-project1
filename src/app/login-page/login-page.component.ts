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
      remember: [true] // Giá trị mặc định cho checkbox "Ghi nhớ đăng nhập"
    });
  }

  submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginData: LoginRequest = {
        email: this.email?.value,
        password: this.password?.value
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          if (response.code === 1000) {
            this.notification.success(
              'Đăng nhập thành công',
              'Chào mừng bạn quay trở lại!',
              { nzDuration: 3000 }
            );
            // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 1000);
          } else {
            this.notification.error(
              'Đăng nhập thất bại',
              response.message || 'Email hoặc mật khẩu không chính xác.',
              { nzDuration: 5000 }
            );
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Login error:', error);
          this.notification.error(
            'Đăng nhập thất bại',
            'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.',
            { nzDuration: 5000 }
          );
          this.isLoading = false;
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

  // Helper để lấy control cho template dễ dàng hơn (tùy chọn)
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}