import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, LoginRequest } from '../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  isLoading = false;

  // Forgot Password Modal
  isForgotPasswordModalOpen = false;
  currentStep = 1;
  totalSteps = 4;
  isProcessing = false;

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

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      verificationCode: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
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


  /*
  Người dùng bấm quên mật khẩu sẽ hiển thị một modal: header có dạng 1 --> 2 --> 3 --> 4
  - Bước 1: Nhập email (ở header có dạng "1. Nhập email")
  - Bước 2: Nhập mã xác thực (ở header có dạng "2. Nhập mã xác thực")
  - Bước 3: Nhập mật khẩu mới (ở header có dạng "3. Nhập mật khẩu mới"), có nhập lại mật khẩu
  - Bước 4: Hoàn tất (ở header có dạng "Hoàn tất")
   */

  // Forgot Password Modal Methods
  openForgotPasswordModal(): void {
    this.isForgotPasswordModalOpen = true;
    this.currentStep = 1;
    this.forgotPasswordForm.reset();
    document.body.style.overflow = 'hidden';
  }

  closeForgotPasswordModal(): void {
    this.isForgotPasswordModalOpen = false;
    this.currentStep = 1;
    this.forgotPasswordForm.reset();
    document.body.style.overflow = 'auto';
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return '1. Nhập email';
      case 2: return '2. Nhập mã xác thực';
      case 3: return '3. Nhập mật khẩu mới';
      case 4: return 'Hoàn tất';
      default: return '';
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.isProcessing = true;

      // Simulate API call delay
      setTimeout(() => {
        this.isProcessing = false;

        switch (this.currentStep) {
          case 1:
            this.notification.success('Thành công', 'Mã xác thực đã được gửi đến email của bạn');
            break;
          case 2:
            this.notification.success('Thành công', 'Mã xác thực chính xác');
            break;
          case 3:
            this.notification.success('Thành công', 'Mật khẩu đã được cập nhật');
            break;
        }

        this.currentStep++;
      }, 1000);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  handleStepAction(): void {
    const currentStepControl = this.getCurrentStepControl();

    if (currentStepControl && currentStepControl.valid) {
      if (this.currentStep === 4) {
        this.closeForgotPasswordModal();
        this.notification.success('Hoàn tất', 'Bạn có thể đăng nhập với mật khẩu mới');
      } else {
        this.nextStep();
      }
    } else {
      this.markFormGroupTouched(currentStepControl);
    }
  }

  getCurrentStepControl(): any {
    switch (this.currentStep) {
      case 1:
        return this.forgotPasswordForm.get('email');
      case 2:
        return this.forgotPasswordForm.get('verificationCode');
      case 3:
        const newPassword = this.forgotPasswordForm.get('newPassword');
        const confirmPassword = this.forgotPasswordForm.get('confirmPassword');
        return (newPassword?.valid && confirmPassword?.valid &&
          newPassword?.value === confirmPassword?.value) ? newPassword : null;
      default:
        return null;
    }
  }

  markFormGroupTouched(control: any): void {
    if (this.currentStep === 3) {
      this.forgotPasswordForm.get('newPassword')?.markAsTouched();
      this.forgotPasswordForm.get('confirmPassword')?.markAsTouched();
    } else if (control) {
      control.markAsTouched();
    }
  }

  isCurrentStepValid(): boolean {
    const control = this.getCurrentStepControl();
    if (this.currentStep === 3) {
      const newPassword = this.forgotPasswordForm.get('newPassword');
      const confirmPassword = this.forgotPasswordForm.get('confirmPassword');
      return !!(newPassword?.valid && confirmPassword?.valid &&
        newPassword?.value === confirmPassword?.value);
    }
    return !!(control?.valid);
  }
}