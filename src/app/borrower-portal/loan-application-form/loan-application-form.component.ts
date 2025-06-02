import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppNotificationService } from '../../services/app-notification.service';
import { UserNotificationService } from '../../services/user-notification.service';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../services/auth.service';

@Component({
  selector: 'app-loan-application-form',
  templateUrl: './loan-application-form.component.html',
  styleUrls: ['./loan-application-form.component.css']
})
export class LoanApplicationFormComponent implements OnInit {
  productId: number | null = null;
  selectedProduct: any = null;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  error: string | null = null;
  isRegistrationSuccess: boolean = false; // Flag to track successful registration
  loanForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private notification: NzNotificationService,
    private appNotificationService: AppNotificationService,
    private userNotificationService: UserNotificationService,
    private apiService: ApiService
  ) {
    this.loanForm = this.fb.group({
      requestedAmount: [null, [Validators.required]],
      requestedTerm: [null, [Validators.required]],
      personalInfo: this.fb.array([
        this.createPersonalInfoGroup()
      ])
    });
  }

  ngOnInit(): void {
    // Get productId from query params
    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.productId = +params['productId'];
        this.loadProductDetails();
      }
    });
  }

  // Load product details
  loadProductDetails(): void {
    if (!this.productId) return;

    this.isLoading = true;
    this.error = null;

    this.loanService.getLoanProductById(this.productId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.selectedProduct = response.data;

          // Update validators based on product constraints
          this.loanForm.get('requestedAmount')?.setValidators([
            Validators.required,
            Validators.min(this.selectedProduct.minAmount),
            Validators.max(this.selectedProduct.maxAmount)
          ]);

          this.loanForm.get('requestedTerm')?.setValidators([
            Validators.required,
            Validators.min(this.selectedProduct.minTerm),
            Validators.max(this.selectedProduct.maxTerm)
          ]);

          // Update validators
          this.loanForm.get('requestedAmount')?.updateValueAndValidity();
          this.loanForm.get('requestedTerm')?.updateValueAndValidity();
        } else {
          this.error = 'Không thể tải thông tin sản phẩm vay. Vui lòng thử lại sau.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải thông tin sản phẩm vay. Vui lòng thử lại sau.';
        this.isLoading = false;
        console.error('Error loading loan product details:', err);
      }
    });
  }

  // Create a personal info form group
  createPersonalInfoGroup(): FormGroup {
    return this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  // Get personal info form array
  get personalInfoArray(): FormArray {
    return this.loanForm.get('personalInfo') as FormArray;
  }

  // Add a new personal info row
  addPersonalInfo(): void {
    this.personalInfoArray.push(this.createPersonalInfoGroup());
  }

  // Remove a personal info row
  removePersonalInfo(index: number): void {
    this.personalInfoArray.removeAt(index);
  }

  // Change product
  changeProduct(): void {
    this.router.navigate(['/borrower-portal/loan-product-list']);
  }

  // Apply for another loan
  applyForAnotherLoan(): void {
    this.isRegistrationSuccess = false;
    this.router.navigate(['/borrower-portal/loan-product-list']);
  }

  // Reset form and apply for another loan with the same product
  applyForSameProduct(): void {
    this.isRegistrationSuccess = false;

    // Reset form
    this.loanForm.reset();

    // Reset personal info array to just one empty item
    const personalInfoArray = this.loanForm.get('personalInfo') as FormArray;
    while (personalInfoArray.length > 0) {
      personalInfoArray.removeAt(0);
    }
    personalInfoArray.push(this.createPersonalInfoGroup());
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Submit form
  submitForm(): void {
    if (this.loanForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.loanForm.controls).forEach(key => {
        const control = this.loanForm.get(key);
        control?.markAsTouched();
      });

      // For FormArray controls
      this.personalInfoArray.controls.forEach(control => {
        control.markAsTouched();
        Object.keys(control.value).forEach(key => {
          (control as FormGroup).get(key)?.markAsTouched();
        });
      });

      return;
    }

    this.isSubmitting = true;

    // Chuyển đổi mảng personalInfo thành đối tượng để JSON stringify
    const personalInfoObject = this.loanForm.value.personalInfo.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Memastikan productId tidak null
    if (!this.productId) {
      this.notification.error(
        'Lỗi dữ liệu',
        'Không tìm thấy thông tin sản phẩm vay. Vui lòng thử lại.',
        { nzDuration: 5000 }
      );
      this.isSubmitting = false;
      return;
    }

    // Prepare application data
    const applicationData = {
      productId: this.productId,
      requestedAmount: this.loanForm.value.requestedAmount,
      requestedTerm: this.loanForm.value.requestedTerm,
      personalInfo: JSON.stringify(personalInfoObject)
    };

    this.loanService.applyForLoan(applicationData).subscribe({
      next: (response) => {
        if (response && response.data) {
          const applicationId = response.data.id;
          this.notification.success(
            'Đăng ký thành công',
            'Đơn đăng ký vay của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
            { nzDuration: 5000 }
          );

          // Create notification for the user
          if (applicationId) {
            this.createNotificationForApplication(applicationId);
          }

          // Set success state
          this.isRegistrationSuccess = true;
          this.isSubmitting = false;
        } else {
          this.notification.error(
            'Đăng ký thất bại',
            'Có lỗi xảy ra khi gửi đơn đăng ký vay. Vui lòng thử lại sau.',
            { nzDuration: 5000 }
          );
          this.isSubmitting = false;
        }

      },
      error: (err) => {
        console.error('Error submitting loan application:', err);
        this.notification.error(
          'Đăng ký thất bại',
          err.error?.message || 'Có lỗi xảy ra khi gửi đơn đăng ký vay. Vui lòng thử lại sau.',
          { nzDuration: 5000 }
        );
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Creates a notification for the loan application
   * @param applicationId ID of the loan application
   */
  private createNotificationForApplication(applicationId: number): void {
    const notificationData = {
      applicationId: applicationId,
      message: "Cảm ơn bạn đã đăng ký dịch vụ vay bên chúng tôi. Để được xét duyệt, vui lòng chuẩn bị hồ sơ cần thiết, thời gian chuẩn bị tối đa 3 ngày",
      notificationType: "DOCUMENT_REQUEST"
    };

    this.apiService.post<any>('/notifications', notificationData).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response && response.data) {
          console.log('Notification created successfully', response.data);

          // Increment the unread notification count
          this.appNotificationService.incrementUnreadCount();
        } else {
          console.error('Failed to create notification', response);
        }
      },
      error: (err: any) => {
        console.error('Error creating notification:', err);
      }
    });
  }
}