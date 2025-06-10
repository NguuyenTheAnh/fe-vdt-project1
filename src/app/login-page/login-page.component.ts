import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, LoginRequest, PasswordResetRequest, AccountActivationRequest } from '../services/auth.service';
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
  @ViewChild('activationStep3Input') activationStep3Input?: ElementRef<HTMLInputElement>;

  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  activationForm!: FormGroup;
  isLoading = false;

  // Forgot Password Modal
  isForgotPasswordModalOpen = false;
  currentStep = 1;
  totalSteps = 4;
  isProcessing = false;
  private shouldFocusStep4Input = false;

  // Account Activation Modal
  isActivationModalOpen = false;
  activationCurrentStep = 1;
  activationTotalSteps = 3;
  isActivationProcessing = false;
  isResendingActivationCode = false;
  showResendActivationButton = false;
  private shouldFocusActivationStep3Input = false;
  userEmail = '';

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

    this.activationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(1)]]
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
                  // Lấy thông tin người dùng hiện tại để kiểm tra role
                  const currentUser = this.authService.getUserService().getCurrentUser();

                  if (currentUser && currentUser.role) {
                    const userRole = currentUser.role.name;
                    console.log('User role:', userRole);

                    // Điều hướng dựa trên role
                    if (userRole !== 'USER') {
                      console.log('Non-user role detected, navigating to admin dashboard');
                      this.router.navigate(['/admin/main-dashboard']);
                    } else {
                      console.log('User role detected, navigating to home');
                      this.router.navigate(['/home']);
                    }
                  } else {
                    // Fallback nếu không có thông tin role
                    console.log('No role information found, navigating to home');
                    this.router.navigate(['/home']);
                  }
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

          // Check for account not activated error (HTTP 403, code 1007)
          if (error.status === 403 && error.error && error.error.code === 1007) {
            this.userEmail = this.loginForm.get('email')?.value || '';
            this.notification.warning(
              'Tài khoản chưa được kích hoạt',
              'Vui lòng kích hoạt tài khoản trước khi đăng nhập.'
            );
            this.openActivationModal();
            return;
          }

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

              // Check for specific error case: expired verification code
              if (error.status === 400 && error.error && error.error.code === 6004) {
                this.notification.error('Mã xác thực đã hết hạn', 'Quay lại bước 1 và nhấn gửi mã để nhận mã mới');
                this.currentStep = 1; // Go back to step 1
              } else {
                this.notification.error('Lỗi', 'Không thể xác thực mã. Vui lòng thử lại.');
              }
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

  // Account Activation Modal Methods
  openActivationModal(): void {
    this.isActivationModalOpen = true;
    this.activationCurrentStep = 1;
    this.showResendActivationButton = false;
    this.activationForm.reset();
    document.body.style.overflow = 'hidden';

    // Automatically send activation email when modal opens
    this.sendActivationEmailForLogin();
  }

  closeActivationModal(): void {
    this.isActivationModalOpen = false;
    this.activationCurrentStep = 1;
    this.showResendActivationButton = false;
    this.activationForm.reset();
    document.body.style.overflow = 'auto';
  }

  sendActivationEmailForLogin(): void {
    if (!this.userEmail) return;

    this.authService.sendAccountActivationEmail(this.userEmail).subscribe({
      next: (response) => {
        if (response.code === 1000) {
          this.notification.success(
            'Email đã được gửi',
            'Vui lòng kiểm tra email để nhận mã kích hoạt tài khoản.'
          );
        } else {
          this.notification.error('Lỗi', 'Không thể gửi email kích hoạt. Vui lòng thử lại.');
        }
      },
      error: (error) => {
        console.error('Error sending activation email:', error);
        this.notification.error('Lỗi', 'Không thể gửi email kích hoạt. Vui lòng thử lại sau.');
      }
    });
  }

  resendActivationCode(): void {
    this.isResendingActivationCode = true;
    this.authService.sendAccountActivationEmail(this.userEmail).subscribe({
      next: (response) => {
        this.isResendingActivationCode = false;
        if (response.code === 1000) {
          this.notification.success('Thành công', 'Mã xác thực mới đã được gửi đến email của bạn');
          this.showResendActivationButton = false;
          this.activationForm.get('verificationCode')?.setValue('');
        } else {
          this.notification.error('Lỗi', 'Không thể gửi lại mã xác thực. Vui lòng thử lại.');
        }
      },
      error: (error) => {
        this.isResendingActivationCode = false;
        console.error('Error resending activation code:', error);
        this.notification.error('Lỗi', 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.');
      }
    });
  }

  getActivationStepTitle(): string {
    switch (this.activationCurrentStep) {
      case 1: return '1. Nhập mã xác thực';
      case 2: return '2. Kích hoạt';
      case 3: return 'Hoàn tất';
      default: return '';
    }
  }

  nextActivationStep(): void {
    if (this.activationCurrentStep < this.activationTotalSteps) {
      this.isActivationProcessing = true;

      switch (this.activationCurrentStep) {
        case 1:
          // Step 1: Verify activation token
          const token = this.activationForm.get('verificationCode')?.value;
          this.authService.verifyAccountActivationToken(token).subscribe({
            next: (response) => {
              this.isActivationProcessing = false;
              if (response.code === 1000 && response.data === true) {
                this.notification.success('Thành công', 'Mã xác thực chính xác');
                this.showResendActivationButton = false;
                this.activationCurrentStep++;
              } else {
                this.notification.error('Lỗi', 'Mã xác thực không chính xác hoặc đã hết hạn');
              }
            },
            error: (error) => {
              this.isActivationProcessing = false;
              console.error('Error verifying activation token:', error);

              if (error.status === 400 && error.error && error.error.code === 6004) {
                this.notification.error('Mã xác thực đã hết hạn', 'Vui lòng nhấn "Gửi lại mã" để nhận mã xác thực mới');
                this.showResendActivationButton = true;
              } else {
                this.notification.error('Lỗi', 'Không thể xác thực mã. Vui lòng thử lại.');
              }
            }
          });
          break;

        case 2:
          // Step 2: Activate account
          const activationData: AccountActivationRequest = {
            email: this.userEmail,
            token: this.activationForm.get('verificationCode')?.value
          };

          this.authService.activateAccount(activationData).subscribe({
            next: (response) => {
              this.isActivationProcessing = false;
              if (response.code === 1000) {
                this.notification.success('Thành công', 'Tài khoản đã được kích hoạt');
                this.activationCurrentStep++;
                this.shouldFocusActivationStep3Input = true;
              } else {
                this.notification.error('Lỗi', response.message || 'Không thể kích hoạt tài khoản. Vui lòng thử lại.');
              }
            },
            error: (error) => {
              this.isActivationProcessing = false;
              console.error('Error activating account:', error);
              this.notification.error('Lỗi', 'Không thể kích hoạt tài khoản. Vui lòng thử lại sau.');
            }
          });
          break;
      }
    }
  }

  previousActivationStep(): void {
    if (this.activationCurrentStep > 1) {
      this.activationCurrentStep--;
    }
  }

  handleActivationStepAction(): void {
    // Handle step 3 separately (completion step)
    if (this.activationCurrentStep === 3) {
      this.closeActivationModal();
      this.notification.success('Hoàn tất', 'Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay.');
      return;
    }

    const currentStepControl = this.getCurrentActivationStepControl();

    if (currentStepControl && currentStepControl.valid) {
      this.nextActivationStep();
    } else {
      this.markActivationFormGroupTouched(currentStepControl);
    }
  }

  getCurrentActivationStepControl(): any {
    switch (this.activationCurrentStep) {
      case 1:
        return this.activationForm.get('verificationCode');
      case 2:
        return { valid: true };
      default:
        return null;
    }
  }

  markActivationFormGroupTouched(control: any): void {
    if (this.activationCurrentStep === 1) {
      this.activationForm.get('verificationCode')?.markAsTouched();
      this.activationForm.get('verificationCode')?.updateValueAndValidity();
    }
  }

  isCurrentActivationStepValid(): boolean {
    if (this.activationCurrentStep === 2 || this.activationCurrentStep === 3) {
      return true;
    }

    const control = this.getCurrentActivationStepControl();
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

    // Focus the activation step 3 input when it becomes available
    if (this.shouldFocusActivationStep3Input && this.activationStep3Input) {
      setTimeout(() => {
        this.activationStep3Input?.nativeElement.focus();
      }, 0);
      this.shouldFocusActivationStep3Input = false;
    }
  }
}