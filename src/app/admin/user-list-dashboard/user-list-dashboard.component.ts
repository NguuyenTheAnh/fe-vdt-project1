import { Component, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserService, User, UserListResponse, GetUsersParams } from '../../services/user.service';
import { RoleService, Role } from '../../services/role.service';

@Component({
  selector: 'app-user-list-dashboard',
  templateUrl: './user-list-dashboard.component.html',
  styleUrls: ['./user-list-dashboard.component.css']
})
export class UserListDashboardComponent implements OnInit {
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

    this.notification.info('Chỉnh sửa người dùng', `Chỉnh sửa người dùng: ${user.fullName}`);
    // TODO: Implement edit user functionality
    console.log('Edit user:', user);
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
  }

  // Custom Status Toggle Modal Methods
  handleStatusToggleOk(): void {
    if (!this.selectedUserForToggle) return;

    const user = this.selectedUserForToggle;
    const newStatus = user.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa';

    this.isTogglingStatus = true;

    // TODO: Replace with actual API call
    setTimeout(() => {
      user.accountStatus = newStatus;
      this.notification.success('Thành công', `Đã ${actionText} người dùng "${user.fullName}" thành công`);
      console.log('Toggle user status:', user);

      // Reset modal state
      this.isStatusToggleModalVisible = false;
      this.selectedUserForToggle = null;
      this.isTogglingStatus = false;

      // Reload users to get updated data from server
      this.loadUsers();
    }, 1500); // Simulate API delay
  }

  handleStatusToggleCancel(): void {
    this.isStatusToggleModalVisible = false;
    this.selectedUserForToggle = null;
    this.isTogglingStatus = false;
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
    }

    return true;
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

    if (this.totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      // Calculate start and end of middle range
      let start = Math.max(2, this.currentPage + 1 - delta);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1 + delta);

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
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
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
}
