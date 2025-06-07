import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, LoginRequest, PasswordResetRequest } from '../services/auth.service';
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
export class LoginPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('step4Input') step4Input?: ElementRef<HTMLInputElement>;

  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  isLoading = false;

  // Forgot Password Modal
  isForgotPasswordModalOpen = false;
  currentStep = 1;
  totalSteps = 4;
  isProcessing = false;
  private shouldFocusStep4Input = false;

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
      verificationCode: ['', [Validators.required, Validators.minLength(1)]],
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
            // Handle specific error codes for login validation
            let errorMessage = 'Email hoặc mật khẩu không chính xác.';

            if (response.code === 1004 || response.code === 1005) {
              errorMessage = 'Email hoặc mật khẩu không chính xác.';
            } else if (response.message) {
              errorMessage = response.message;
            }

            this.notification.error(
              'Đăng nhập thất bại',
              errorMessage
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);

          // Check if the error response has specific codes
          let errorMessage = 'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.';

          if (error.error && error.error.code) {
            if (error.error.code === 1004 || error.error.code === 1005) {
              errorMessage = 'Email hoặc mật khẩu không chính xác.';
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          }

          this.notification.error(
            'Đăng nhập thất bại',
            errorMessage
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

      switch (this.currentStep) {
        case 1:
          // Step 1: Send password reset email
          const email = this.forgotPasswordForm.get('email')?.value;
          this.authService.sendPasswordResetEmail(email).subscribe({
            next: (response) => {
              this.isProcessing = false;
              if (response.code === 1000) {
                this.notification.success('Thành công', 'Mã xác thực đã được gửi đến email của bạn');
                this.currentStep++;
              } else {
                this.notification.error('Lỗi', response.message || 'Không thể gửi email. Vui lòng thử lại.');
              }
            },
            error: (error) => {
              this.isProcessing = false;
              console.error('Error sending reset email:', error);
              this.notification.error('Lỗi', 'Không thể gửi email xác thực. Vui lòng thử lại sau.');
            }
          });
          break;

        case 2:
          // Step 2: Verify reset token
          const token = this.forgotPasswordForm.get('verificationCode')?.value;
          this.authService.verifyPasswordResetToken(token).subscribe({
            next: (response) => {
              this.isProcessing = false;
              if (response.code === 1000 && response.data === true) {
                this.notification.success('Thành công', 'Mã xác thực chính xác');
                this.currentStep++;
              } else {
                this.notification.error('Lỗi', 'Mã xác thực không chính xác hoặc đã hết hạn');
              }
            },
            error: (error) => {
              this.isProcessing = false;
              console.error('Error verifying token:', error);
              this.notification.error('Lỗi', 'Không thể xác thực mã. Vui lòng thử lại.');
            }
          });
          break;

        case 3:
          // Step 3: Reset password
          const resetData: PasswordResetRequest = {
            email: this.forgotPasswordForm.get('email')?.value,
            newPassword: this.forgotPasswordForm.get('newPassword')?.value,
            token: this.forgotPasswordForm.get('verificationCode')?.value
          };

          this.authService.resetPassword(resetData).subscribe({
            next: (response) => {
              this.isProcessing = false;
              if (response.code === 1000) {
                this.notification.success('Thành công', 'Mật khẩu đã được cập nhật');
                this.currentStep++;
                // Trigger focus for step 4 input
                this.shouldFocusStep4Input = true;
              } else {
                this.notification.error('Lỗi', response.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
              }
            },
            error: (error) => {
              this.isProcessing = false;
              console.error('Error resetting password:', error);
              this.notification.error('Lỗi', 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.');
            }
          });
          break;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  handleStepAction(): void {
    console.log('handleStepAction called, currentStep:', this.currentStep);

    // Handle step 4 separately (completion step)
    if (this.currentStep === 4) {
      console.log('Closing modal from step 4');
      this.closeForgotPasswordModal();
      this.notification.success('Hoàn tất', 'Bạn có thể đăng nhập với mật khẩu mới');
      return;
    }

    const currentStepControl = this.getCurrentStepControl();

    if (currentStepControl && currentStepControl.valid) {
      this.nextStep();
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

        // Check if both passwords are valid and match
        if (newPassword?.valid && confirmPassword?.valid &&
          newPassword?.value === confirmPassword?.value) {
          return newPassword;
        }
        return null;
      default:
        return null;
    }
  }

  markFormGroupTouched(control: any): void {
    if (this.currentStep === 1) {
      this.forgotPasswordForm.get('email')?.markAsTouched();
      this.forgotPasswordForm.get('email')?.updateValueAndValidity();
    } else if (this.currentStep === 2) {
      this.forgotPasswordForm.get('verificationCode')?.markAsTouched();
      this.forgotPasswordForm.get('verificationCode')?.updateValueAndValidity();
    } else if (this.currentStep === 3) {
      this.forgotPasswordForm.get('newPassword')?.markAsTouched();
      this.forgotPasswordForm.get('confirmPassword')?.markAsTouched();
      this.forgotPasswordForm.get('newPassword')?.updateValueAndValidity();
      this.forgotPasswordForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  isCurrentStepValid(): boolean {
    // Step 4 is always valid (completion step)
    if (this.currentStep === 4) {
      return true;
    }

    const control = this.getCurrentStepControl();
    if (this.currentStep === 3) {
      const newPassword = this.forgotPasswordForm.get('newPassword');
      const confirmPassword = this.forgotPasswordForm.get('confirmPassword');
      return !!(newPassword?.valid && confirmPassword?.valid &&
        newPassword?.value === confirmPassword?.value);
    }
    return !!(control?.valid);
  }

  ngAfterViewChecked(): void {
    // Focus the step 4 input when it becomes available
    if (this.shouldFocusStep4Input && this.step4Input) {
      setTimeout(() => {
        this.step4Input?.nativeElement.focus();
      }, 0);
      this.shouldFocusStep4Input = false;
    }
  }
}