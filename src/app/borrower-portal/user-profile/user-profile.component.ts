import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { UserData } from '../../services/auth.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userProfile: UserData | null = null;
  isLoading = false;
  error: string | null = null;

  // Modal visibility flags
  isEditModalVisible = false;
  isPasswordModalVisible = false;

  // Form related properties
  editForm!: FormGroup;
  passwordForm!: FormGroup;
  isSubmitting = false;

  // Password related properties
  showPassword = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private modalService: NzModalService
  ) {
    this.createForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private createForms(): void {
    // Initialize the edit profile form
    this.editForm = this.fb.group({
      fullName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^\d{9,11}$/)]],
      address: ['']
    });

    // Initialize the password change form
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.fetchCurrentUserProfile().subscribe({
      next: (userData) => {
        this.userProfile = userData;
        this.isLoading = false;

        // Update the form values if user data is available
        if (userData) {
          this.editForm.patchValue({
            fullName: userData.fullName || '',
            phoneNumber: userData.phoneNumber || '',
            address: userData.address || ''
          });
        }
      },
      error: (err) => {
        console.error('Error loading user profile', err);
        this.error = 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.notificationService.error('Lỗi', this.error);
      }
    });
  }

  // Show the edit profile modal
  showEditModal(): void {
    if (this.userProfile) {
      // Reset the form with current user data
      this.editForm.patchValue({
        fullName: this.userProfile.fullName || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        address: this.userProfile.address || ''
      });
    }
    this.isEditModalVisible = true;
  }

  // Handle edit modal cancel
  handleEditCancel(): void {
    this.isEditModalVisible = false;
  }

  // Submit updated profile information
  submitEditForm(): void {
    if (this.editForm.invalid) {
      // Mark all fields as touched to trigger validation
      for (const i in this.editForm.controls) {
        this.editForm.controls[i].markAsDirty();
        this.editForm.controls[i].updateValueAndValidity();
      }
      return;
    }

    this.isSubmitting = true;
    const updateData = this.editForm.value;

    this.userService.updateUserProfile(updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && response.code === 1000) {
          this.notificationService.success('Thành công', 'Thông tin cá nhân đã được cập nhật.');
          this.isEditModalVisible = false;
          this.loadUserProfile(); // Reload user profile data
        } else {
          this.notificationService.error('Lỗi', response.message || 'Không thể cập nhật thông tin cá nhân.');
        }
      },
      error: (err) => {
        console.error('Error updating user profile:', err);
        this.isSubmitting = false;
        this.notificationService.error('Lỗi', 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.');
      }
    });
  }

  // Show the change password modal
  showPasswordModal(): void {
    this.passwordForm.reset();
    this.isPasswordModalVisible = true;
    this.showPassword = false;
    this.passwordStrength = 'weak';
  }

  // Handle password modal cancel
  handlePasswordCancel(): void {
    this.isPasswordModalVisible = false;
  }

  // Submit new password
  submitPasswordForm(): void {
    if (this.passwordForm.invalid) {
      // Mark all fields as touched to trigger validation
      for (const i in this.passwordForm.controls) {
        this.passwordForm.controls[i].markAsDirty();
        this.passwordForm.controls[i].updateValueAndValidity();
      }
      return;
    }

    if (!this.userProfile) {
      this.notificationService.error('Lỗi', 'Không có thông tin người dùng.');
      return;
    }

    this.isSubmitting = true;
    const updateData = {
      fullName: this.userProfile.fullName || '',
      phoneNumber: this.userProfile.phoneNumber || '',
      address: this.userProfile.address || '',
      password: this.passwordForm.value.password
    };

    this.userService.updateUserProfile(updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && response.code === 1000) {
          this.notificationService.success('Thành công', 'Mật khẩu đã được cập nhật.');
          this.isPasswordModalVisible = false;
        } else {
          this.notificationService.error('Lỗi', response.message || 'Không thể cập nhật mật khẩu.');
        }
      },
      error: (err) => {
        console.error('Error updating password:', err);
        this.isSubmitting = false;
        this.notificationService.error('Lỗi', 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.');
      }
    });
  }

  // Check password strength
  checkPasswordStrength(): void {
    const password = this.passwordForm.get('password')?.value;

    if (!password) {
      this.passwordStrength = 'weak';
      return;
    }

    // Check password strength based on criteria
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    }

    // Contains uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Contains lowercase letters
    if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Contains numbers
    if (/[0-9]/.test(password)) {
      score += 1;
    }

    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    // Set strength based on score
    if (score <= 2) {
      this.passwordStrength = 'weak';
    } else if (score <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  // Custom validator to check if password and confirm password match
  private passwordMatchValidator(fg: FormGroup): { [key: string]: boolean } | null {
    const password = fg.get('password')?.value;
    const confirmPassword = fg.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { 'mismatch': true };
    }
    return null;
  }
}
