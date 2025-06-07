import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, RegisterRequest, AccountActivationRequest } from '../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

// Custom validator để so sánh mật khẩu
export function passwordMatchValidator(controlName: string, matchingControlName: string) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
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
export class RegisterPageComponent implements OnInit, AfterViewChecked {
  @ViewChild('step3Input') step3Input?: ElementRef<HTMLInputElement>;

  registerForm!: FormGroup;
  activationForm!: FormGroup;
  isLoading = false;
  loadingText = 'Đang xử lý...';

  // Account Activation Modal
  isActivationModalOpen = false;
  currentStep = 1;
  totalSteps = 3;
  isProcessing = false;
  private shouldFocusStep3Input = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NzNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator('password', 'confirmPassword')
    });

    this.activationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  submitForm(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const registerData: RegisterRequest = {
        email: this.registerForm.get('email')?.value || '',
        password: this.registerForm.get('password')?.value || '',
        fullName: this.registerForm.get('fullName')?.value || '',
        phoneNumber: this.registerForm.get('phoneNumber')?.value || '',
        address: this.registerForm.get('address')?.value || ''
      };

      // First register the user
      this.authService.register(registerData).subscribe({
        next: (response) => {
          if (response.code === 1000) {
            // Registration successful, now send activation email
            this.userEmail = registerData.email;
            this.authService.sendAccountActivationEmail(this.userEmail).subscribe({
              next: (emailResponse) => {
                this.isLoading = false;
                if (emailResponse.code === 1000) {
                  this.notification.success(
                    'Đăng ký thành công',
                    'Vui lòng kiểm tra email để kích hoạt tài khoản.'
                  );
                  this.openActivationModal();
                } else {
                  this.notification.error(
                    'Lỗi',
                    'Đăng ký thành công nhưng không thể gửi email kích hoạt. Vui lòng thử lại.'
                  );
                }
              },
              error: (emailError) => {
                this.isLoading = false;
                console.error('Error sending activation email:', emailError);
                this.notification.error(
                  'Lỗi',
                  'Đăng ký thành công nhưng không thể gửi email kích hoạt. Vui lòng thử lại.'
                );
              }
            });
          } else {
            this.isLoading = false;
            this.notification.error(
              'Đăng ký thất bại',
              response.message || 'Đã xảy ra lỗi khi đăng ký tài khoản.'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Register error:', error);
          this.notification.error(
            'Đăng ký thất bại',
            'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.'
          );
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      const confirmPasswordControl = this.registerForm.get('confirmPassword');
      if (this.registerForm.hasError('passwordMismatch') && confirmPasswordControl) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        confirmPasswordControl.markAsDirty();
        confirmPasswordControl.updateValueAndValidity({ onlySelf: true });
      }
    }
  }

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get fullName() { return this.registerForm.get('fullName'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get address() { return this.registerForm.get('address'); }

  // Account Activation Modal Methods
  openActivationModal(): void {
    this.isActivationModalOpen = true;
    this.currentStep = 1;
    this.activationForm.reset();
    document.body.style.overflow = 'hidden';
  }

  closeActivationModal(): void {
    this.isActivationModalOpen = false;
    this.currentStep = 1;
    this.activationForm.reset();
    document.body.style.overflow = 'auto';
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return '1. Nhập mã xác thực';
      case 2: return '2. Kích hoạt';
      case 3: return 'Hoàn tất';
      default: return '';
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.isProcessing = true;

      switch (this.currentStep) {
        case 1:
          // Step 1: Verify activation token
          const token = this.activationForm.get('verificationCode')?.value;
          this.authService.verifyAccountActivationToken(token).subscribe({
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
              console.error('Error verifying activation token:', error);

              // Check for specific error case: expired verification code
              if (error.status === 400 && error.error && error.error.code === 6004) {
                this.notification.error('Mã xác thực đã hết hạn', 'Vui lòng nhấn đăng ký để nhận mã xác thực khác');
                this.closeActivationModal();
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
              this.isProcessing = false;
              if (response.code === 1000) {
                this.notification.success('Thành công', 'Tài khoản đã được kích hoạt');
                this.currentStep++;
                // Trigger focus for step 3 input
                this.shouldFocusStep3Input = true;
              } else {
                this.notification.error('Lỗi', response.message || 'Không thể kích hoạt tài khoản. Vui lòng thử lại.');
              }
            },
            error: (error) => {
              this.isProcessing = false;
              console.error('Error activating account:', error);
              this.notification.error('Lỗi', 'Không thể kích hoạt tài khoản. Vui lòng thử lại sau.');
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

    // Handle step 3 separately (completion step)
    if (this.currentStep === 3) {
      console.log('Navigating to login from step 3');
      this.closeActivationModal();
      this.notification.success('Hoàn tất', 'Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay.');
      this.router.navigate(['/login']);
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
        return this.activationForm.get('verificationCode');
      default:
        return null;
    }
  }

  markFormGroupTouched(control: any): void {
    if (this.currentStep === 1) {
      this.activationForm.get('verificationCode')?.markAsTouched();
      this.activationForm.get('verificationCode')?.updateValueAndValidity();
    }
  }

  isCurrentStepValid(): boolean {
    // Step 3 is always valid (completion step)
    if (this.currentStep === 3) {
      return true;
    }

    const control = this.getCurrentStepControl();
    return !!(control?.valid);
  }

  ngAfterViewChecked(): void {
    // Focus the step 3 input when it becomes available
    if (this.shouldFocusStep3Input && this.step3Input) {
      setTimeout(() => {
        this.step3Input?.nativeElement.focus();
      }, 0);
      this.shouldFocusStep3Input = false;
    }
  }
}