import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserService, User, UserListResponse, GetUsersParams, AdminUserUpdateRequest } from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';

@Component({
  selector: 'app-user-list-dashboard',
  templateUrl: './user-list-dashboard.component.html',
  styleUrls: ['./user-list-dashboard.component.css']
})
export class UserListDashboardComponent implements OnInit, OnDestroy {
  // Data from API
  users: User[] = [];

  // UI state
  isLoading = false;
  error: string | null = null;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  // Search and filter
  searchValue = '';
  selectedStatus: 'ACTIVE' | 'INACTIVE' | null = null;
  selectedRole: 'ALL' | 'USER' | 'ADMIN' | null = 'ALL';

  // Add User Modal
  isAddUserModalVisible = false;
  addUserForm = {
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    roleName: '',
    address: ''
  };
  availableRoles: Role[] = [];
  isLoadingRoles = false;
  isCreatingUser = false;

  // Status Toggle Modal
  isStatusToggleModalVisible = false;
  selectedUserForToggle: User | null = null;
  isTogglingStatus = false;

  // User Detail Modal
  isUserDetailModalVisible = false;
  selectedUserForDetail: User | null = null;
  isLoadingUserDetail = false;
  userDetailError: string | null = null;
  // Edit User Modal
  isEditUserModalVisible = false;
  selectedUserForEdit: User | null = null;
  editUserForm: AdminUserUpdateRequest = {
    fullName: '',
    phoneNumber: '',
    address: '',
    accountStatus: 'ACTIVE',
    roleName: ''
  };
  isUpdatingUser = false;
  showAdvancedSettings = false;

  // Status labels
  statusLabels = {
    'ACTIVE': 'Đã kích hoạt',
    'INACTIVE': 'Chưa kích hoạt'
  };

  // Role labels
  roleLabels = {
    'ALL': 'Tất cả',
    'USER': 'Người dùng',
    'ADMIN': 'Quản lý'
  };

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private userService: UserService,
    private roleService: RoleService
  ) { }
  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    // Ensure body scroll is restored when component is destroyed
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    const params: GetUsersParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    // Add search filter if provided
    if (this.searchValue && this.searchValue.trim()) {
      params.name = this.searchValue.trim();
    }

    // Add status filter if selected
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    this.userService.getAllUsers(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response) {
          // Filter out user with ID 1 (main admin account) for security reasons
          let filteredUsers = response.content.filter(user => user.id !== 1);

          // Apply role filter
          if (this.selectedRole && this.selectedRole !== 'ALL') {
            if (this.selectedRole === 'USER') {
              filteredUsers = filteredUsers.filter(user => user.role.name === 'USER');
            } else if (this.selectedRole === 'ADMIN') {
              filteredUsers = filteredUsers.filter(user => user.role.name !== 'USER');
            }
          }

          this.users = filteredUsers;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          console.log('Users loaded successfully:', this.users.length);

          // Log if admin user was filtered out
          const adminUserFiltered = response.content.find(user => user.id === 1);
          if (adminUserFiltered) {
            console.log('Admin user (ID: 1) filtered out for security reasons');
          }
        } else {
          this.error = 'Không thể tải danh sách người dùng';
          this.users = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Đã xảy ra lỗi khi tải danh sách người dùng';
        this.users = [];
        console.error('Error loading users:', error);
        this.notification.error('Lỗi tải dữ liệu', 'Không thể tải danh sách người dùng');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0; // Reset to first page when searching
    this.loadUsers();
  }

  onSearchInputChange(value: string): void {
    this.searchValue = value;
    if (!value.trim()) {
      // If search is cleared, reload immediately
      this.onSearch();
    }
  }

  onStatusFilterChange(status: 'ACTIVE' | 'INACTIVE' | null): void {
    this.selectedStatus = status;
    this.currentPage = 0; // Reset to first page when filtering
    this.loadUsers();
  }

  onRoleFilterChange(role: 'ALL' | 'USER' | 'ADMIN' | null): void {
    this.selectedRole = role;
    this.currentPage = 0; // Reset to first page when filtering
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page - 1; // ng-zorro pagination is 1-based, API is 0-based
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Reset to first page when changing page size
    this.loadUsers();
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status as keyof typeof this.statusLabels] || status;
  }

  viewUserDetails(user: User): void {
    // Security check: prevent viewing admin user details
    if (user.id === 1) {
      this.notification.warning('Quyền hạn bị hạn chế', 'Không thể xem chi tiết tài khoản này');
      return;
    }

    this.notification.info('Xem chi tiết', `Xem chi tiết người dùng: ${user.fullName}`);
    // TODO: Implement view details functionality
    console.log('View user details:', user);
  }
  editUser(user: User): void {
    // Security check: prevent editing admin user
    if (user.id === 1) {
      this.notification.warning('Quyền hạn bị hạn chế', 'Không thể chỉnh sửa tài khoản này');
      return;
    }

    this.showEditUserModal(user);
  }
  toggleUserStatus(user: User): void {
    // Security check: prevent toggling admin user status
    if (user.id === 1) {
      this.notification.warning('Quyền hạn bị hạn chế', 'Không thể thay đổi trạng thái tài khoản này');
      return;
    }

    // Show custom modal instead of default confirm
    this.selectedUserForToggle = user;
    this.isStatusToggleModalVisible = true;

    // Prevent body scroll when modal opens
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }
  // Custom Status Toggle Modal Methods
  handleStatusToggleOk(): void {
    if (!this.selectedUserForToggle) return;

    const user = this.selectedUserForToggle;
    const newStatus = user.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa';

    this.isTogglingStatus = true;

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: (success) => {
        this.isTogglingStatus = false;
        if (success) {
          this.notification.success('Thành công', `Đã ${actionText} người dùng "${user.fullName}" thành công`);
          console.log('Toggle user status successful for user ID:', user.id);
          this.loadUsers(); // Reload the user list to reflect changes
        } else {
          this.notification.error('Lỗi', `Không thể ${actionText} người dùng "${user.fullName}". Vui lòng thử lại.`);
        }

        // Reset modal state
        this.isStatusToggleModalVisible = false;
        this.selectedUserForToggle = null;

        // Restore body scroll when modal closes
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      },
      error: (error) => {
        this.isTogglingStatus = false;
        console.error('Error toggling user status:', error);
        this.notification.error('Lỗi hệ thống', `Đã xảy ra lỗi khi ${actionText} người dùng. Vui lòng thử lại sau.`);

        // Reset modal state even on error
        this.isStatusToggleModalVisible = false;
        this.selectedUserForToggle = null;

        // Restore body scroll when modal closes
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      }
    });
  }
  handleStatusToggleCancel(): void {
    this.isStatusToggleModalVisible = false;
    this.selectedUserForToggle = null;
    this.isTogglingStatus = false;

    // Restore body scroll when modal closes
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }

  getToggleActionText(): string {
    if (!this.selectedUserForToggle) return '';
    return this.selectedUserForToggle.accountStatus === 'ACTIVE' ? 'vô hiệu hóa' : 'kích hoạt';
  }

  getToggleStatusText(): string {
    if (!this.selectedUserForToggle) return '';
    return this.selectedUserForToggle.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }

  // Add User Modal Methods
  showAddUserModal(): void {
    this.isAddUserModalVisible = true;
    this.loadRoles();
    this.resetAddUserForm();
  }

  handleAddUserModalOk(): void {
    if (this.validateAddUserForm()) {
      this.createUser();
    }
  }

  handleAddUserModalCancel(): void {
    this.isAddUserModalVisible = false;
    this.resetAddUserForm();
  }  // Edit User Modal Methods
  toggleAdvancedSettings(): void {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }

  validateEditUserForm(): boolean {
    if (!this.editUserForm.fullName?.trim()) {
      this.notification.error('Lỗi xác thực', 'Vui lòng nhập họ và tên');
      return false;
    }

    if (!this.editUserForm.phoneNumber?.trim()) {
      this.notification.error('Lỗi xác thực', 'Vui lòng nhập số điện thoại');
      return false;
    }

    if (!this.editUserForm.address?.trim()) {
      this.notification.error('Lỗi xác thực', 'Vui lòng nhập địa chỉ');
      return false;
    }

    if (!this.editUserForm.roleName?.trim()) {
      this.notification.error('Lỗi xác thực', 'Vui lòng chọn vai trò');
      return false;
    }

    if (!this.editUserForm.accountStatus) {
      this.notification.error('Lỗi xác thực', 'Vui lòng chọn trạng thái tài khoản');
      return false;
    }

    // Optional fields validation
    if (this.editUserForm.email && this.editUserForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.editUserForm.email)) {
        this.notification.error('Lỗi xác thực', 'Email không đúng định dạng');
        return false;
      }
    }

    if (this.editUserForm.password && this.editUserForm.password.trim() && this.editUserForm.password.length < 6) {
      this.notification.error('Lỗi xác thực', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    return true;
  }

  resetEditUserForm(): void {
    this.editUserForm = {
      fullName: '',
      phoneNumber: '',
      address: '',
      accountStatus: 'ACTIVE',
      roleName: ''
    };
    this.showAdvancedSettings = false;
  }

  showEditUserModal(user: User): void {
    this.isEditUserModalVisible = true;
    this.selectedUserForEdit = user;
    this.editUserForm = {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      accountStatus: user.accountStatus,
      roleName: user.role.name
    };
    this.loadRoles(); // Load available roles for the dropdown
  }

  handleEditUserModalOk(): void {
    if (this.validateEditUserForm()) {
      this.updateUser();
    }
  }
  handleEditUserModalCancel(): void {
    this.isEditUserModalVisible = false;
    this.selectedUserForEdit = null;
    this.resetEditUserForm();
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.isLoadingRoles = false;
        if (response && response.code === 1000 && response.data) {
          this.availableRoles = response.data;
          console.log('Roles loaded successfully:', this.availableRoles);
        } else {
          this.notification.error('Lỗi tải dữ liệu', 'Không thể tải danh sách vai trò');
          this.availableRoles = [];
        }
      },
      error: (error) => {
        this.isLoadingRoles = false;
        console.error('Error loading roles:', error);
        this.notification.error('Lỗi hệ thống', 'Đã xảy ra lỗi khi tải danh sách vai trò');
        this.availableRoles = [];
      }
    });
  }

  validateAddUserForm(): boolean {
    if (!this.addUserForm.email.trim()) {
      this.notification.error('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }

    if (!this.addUserForm.password.trim()) {
      this.notification.error('Thiếu thông tin', 'Vui lòng nhập mật khẩu');
      return false;
    }

    if (!this.addUserForm.fullName.trim()) {
      this.notification.error('Thiếu thông tin', 'Vui lòng nhập họ tên');
      return false;
    }

    if (!this.addUserForm.phoneNumber.trim()) {
      this.notification.error('Thiếu thông tin', 'Vui lòng nhập số điện thoại');
      return false;
    }

    if (!this.addUserForm.roleName) {
      this.notification.error('Thiếu thông tin', 'Vui lòng chọn vai trò');
      return false;
    }

    if (!this.addUserForm.address.trim()) {
      this.notification.error('Thiếu thông tin', 'Vui lòng nhập địa chỉ');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.addUserForm.email)) {
      this.notification.error('Email không hợp lệ', 'Email không đúng định dạng');
      return false;
    }

    // Validate password length
    if (this.addUserForm.password.length < 6) {
      this.notification.error('Mật khẩu không hợp lệ', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    } return true;
  }

  createUser(): void {
    this.isCreatingUser = true;

    this.userService.createUser(this.addUserForm).subscribe({
      next: (user) => {
        this.isCreatingUser = false;
        if (user) {
          this.notification.success('Tạo người dùng thành công', 'Người dùng mới đã được thêm vào hệ thống');
          this.isAddUserModalVisible = false;
          this.resetAddUserForm();
          this.loadUsers(); // Reload the user list
        } else {
          this.notification.error('Tạo người dùng thất bại', 'Không thể tạo người dùng');
        }
      },
      error: (error) => {
        this.isCreatingUser = false;
        console.error('Error creating user:', error);
        this.notification.error('Lỗi hệ thống', 'Đã xảy ra lỗi khi tạo người dùng');
      }
    });
  }
  updateUser(): void {
    if (!this.selectedUserForEdit) return;

    this.isUpdatingUser = true;

    this.userService.adminUpdateUser(this.selectedUserForEdit.id, this.editUserForm).subscribe({
      next: (user: User | null) => {
        this.isUpdatingUser = false;
        if (user) {
          this.notification.success('Cập nhật người dùng thành công', 'Thông tin người dùng đã được cập nhật');
          this.isEditUserModalVisible = false;
          this.loadUsers(); // Reload the user list
        } else {
          this.notification.error('Cập nhật người dùng thất bại', 'Không thể cập nhật thông tin người dùng');
        }
      },
      error: (error: any) => {
        this.isUpdatingUser = false;
        console.error('Error updating user:', error);

        // Handle specific error messages
        if (error.status === 400) {
          this.notification.error('Lỗi', 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
        } else if (error.status === 403) {
          this.notification.error('Lỗi', 'Bạn không có quyền cập nhật thông tin người dùng này.');
        } else if (error.status === 404) {
          this.notification.error('Lỗi', 'Không tìm thấy người dùng cần cập nhật.');
        } else {
          this.notification.error('Lỗi hệ thống', 'Đã xảy ra lỗi khi cập nhật người dùng');
        }
      }
    });
  }

  resetAddUserForm(): void {
    this.addUserForm = {
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      roleName: '',
      address: ''
    };
  }
  // Pagination helper methods
  getPaginationRange(): (number | string)[] {
    const range: (number | string)[] = [];
    const delta = 2; // Number of pages to show around current page
    const currentDisplayPage = this.getCurrentPageDisplay(); // 1-based current page

    if (this.totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      // Calculate start and end of middle range
      let start = Math.max(2, currentDisplayPage - delta);
      let end = Math.min(this.totalPages - 1, currentDisplayPage + delta);

      // Adjust range if too close to beginning
      if (start <= 3) {
        start = 2;
        end = Math.min(this.totalPages - 1, 5);
      }

      // Adjust range if too close to end
      if (end >= this.totalPages - 2) {
        end = this.totalPages - 1;
        start = Math.max(2, this.totalPages - 4);
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        range.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < this.totalPages - 1) {
        range.push('...');
      }

      // Always show last page
      if (this.totalPages > 1) {
        range.push(this.totalPages);
      }
    }

    return range;
  }
  goToPage(page: number): void {
    const targetPage = page - 1; // Convert to 0-based for API
    if (targetPage >= 0 && targetPage < this.totalPages && targetPage !== this.currentPage) {
      this.currentPage = targetPage;
      this.loadUsers();
    }
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  getCurrentPageDisplay(): number {
    return this.currentPage + 1;
  }

  isCurrentPage(pageNumber: number | string): boolean {
    if (typeof pageNumber === 'string') return false;
    return pageNumber === this.getCurrentPageDisplay();
  }

  // User Detail Modal Methods
  showUserDetail(userId: number): void {
    this.isUserDetailModalVisible = true;
    this.isLoadingUserDetail = true;
    this.userDetailError = null;
    this.selectedUserForDetail = null;

    // Prevent body scroll when modal opens
    document.body.classList.add('modal-open');

    // Ensure modal starts at top
    setTimeout(() => {
      const modalElement = document.querySelector('.user-detail-modal .ant-modal-body');
      if (modalElement) {
        modalElement.scrollTop = 0;
      }
    }, 0);

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.isLoadingUserDetail = false;
        if (user) {
          this.selectedUserForDetail = user;
        } else {
          this.userDetailError = 'Không thể tải thông tin người dùng';
        }
      },
      error: (error) => {
        this.isLoadingUserDetail = false;
        this.userDetailError = 'Có lỗi xảy ra khi tải thông tin người dùng';
        console.error('Error loading user detail:', error);
      }
    });
  }

  closeUserDetailModal(): void {
    this.isUserDetailModalVisible = false;
    this.selectedUserForDetail = null;
    this.userDetailError = null;
    this.isLoadingUserDetail = false;

    // Re-enable body scroll when modal closes
    document.body.classList.remove('modal-open');
  }
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Chưa cập nhật';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  }

  // Edit User Modal Methods  
  showEditUserModalFromDetail(): void {
    if (this.selectedUserForDetail) {
      this.closeUserDetailModal();
      this.showEditUserModal(this.selectedUserForDetail);
    }
  }
}
