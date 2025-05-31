import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService, RegisterRequest } from '../services/auth.service';

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
  styleUrls: ['./register-page.component.css']
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  loadingText = 'Đang xử lý...';

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

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.code === 1000) {
            this.notification.success(
              'Đăng ký thành công',
              'Tài khoản của bạn đã được tạo thành công.'
            );
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          } else {
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
}