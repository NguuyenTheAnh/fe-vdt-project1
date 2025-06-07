import { Component, OnInit } from '@angular/core';
import { RoleService, Permission, Role } from '../../services/role.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-role-dashboard',
  templateUrl: './role-dashboard.component.html',
  styleUrls: ['./role-dashboard.component.css']
})
export class RoleDashboardComponent implements OnInit {
  permissions: Permission[] = [];
  roles: Role[] = [];
  isLoading: boolean = false;
  isLoadingRoles: boolean = false;
  error: string | null = null;
  errorRoles: string | null = null;

  isTestAccordionOpen: boolean = false;
  openRoleAccordions: { [key: string]: boolean } = {};
  editingRoleStates: { [roleName: string]: boolean } = {};
  roleTemporaryPermissions: { [roleName: string]: { [permissionName: string]: boolean } } = {};
  roleTemporaryDetails: { [roleName: string]: { name: string; description: string } } = {}; // Added

  permissionStates: { [key: string]: boolean } = {};

  // New role creation modal
  isCreateModalVisible: boolean = false;
  newRoleName: string = '';
  isCreatingRole: boolean = false;

  constructor(
    private roleService: RoleService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.loadRoles(); // Call loadRoles
  }

  /**
   * Load permissions from API
   */
  loadPermissions(): void {
    this.isLoading = true;
    this.error = null;

    this.roleService.getPermissions().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.permissions = response.data;
          // Initialize permission states to false
          this.permissions.forEach(permission => {
            this.permissionStates[permission.name] = false;
          });
        } else {
          this.permissions = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải danh sách quyền. Vui lòng thử lại sau.';
        this.isLoading = false;
        console.error('Error loading permissions:', err);
      }
    });
  }

  /**
   * Load roles from API
   */
  loadRoles(): void {
    this.isLoadingRoles = true;
    this.errorRoles = null;
    this.roleService.getRoles().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.roles = response.data.filter(role => role.name !== 'ADMIN');
          this.roles.forEach(role => {
            this.openRoleAccordions[role.name] = false;
            this.editingRoleStates[role.name] = false; // Initialize edit mode state
          });
        } else {
          this.roles = [];
        }
        this.isLoadingRoles = false;
      },
      error: (err) => {
        this.errorRoles = 'Không thể tải danh sách vai trò. Vui lòng thử lại sau.';
        this.isLoadingRoles = false;
        console.error('Error loading roles:', err);
      }
    });
  }

  /**
   * Check if a role has a specific permission
   * @param role The role to check
   * @param permissionName The name of the permission to check for
   * @returns True if the role has the permission, false otherwise
   */
  hasPermission(role: Role, permissionName: string): boolean {
    return role.permissions.some(p => p.name === permissionName);
  }

  startEditMode(role: Role): void {
    this.editingRoleStates[role.name] = true;
    // Initialize temporary permissions
    this.roleTemporaryPermissions[role.name] = {};
    this.permissions.forEach(p => {
      this.roleTemporaryPermissions[role.name][p.name] = this.hasPermission(role, p.name);
    });
    // Initialize temporary role details
    this.roleTemporaryDetails[role.name] = {
      name: role.name,
      description: role.description
    };
  }

  saveChanges(roleName: string): void {
    // roleName here is the original name, used as an identifier
    const roleToUpdate = this.roles.find(r => r.name === roleName);

    if (roleToUpdate && this.roleTemporaryPermissions[roleName] && this.roleTemporaryDetails[roleName]) {
      const updatedPermissionNames = this.permissions
        .filter(p => this.roleTemporaryPermissions[roleName][p.name])
        .map(p => p.name);

      const payload = {
        name: this.roleTemporaryDetails[roleName].name, // Potentially new name
        description: this.roleTemporaryDetails[roleName].description, // Potentially new description
        permissions: updatedPermissionNames
      };

      // Pass the original roleName for the API path, and payload for the body
      this.roleService.updateRole(roleName, payload).subscribe({
        next: (response) => {
          if (response && response.data) {
            const updatedRoleFromServer = response.data;
            const index = this.roles.findIndex(r => r.name === roleName); // Find by original name
            if (index !== -1) {
              // Update local role with data from server, which might include a new name
              this.roles[index] = updatedRoleFromServer;
              // If name changed, we need to update our state tracking keys
              if (roleName !== updatedRoleFromServer.name) {
                Object.keys(this.openRoleAccordions).forEach(key => {
                  if (key === roleName) {
                    this.openRoleAccordions[updatedRoleFromServer.name] = this.openRoleAccordions[roleName];
                    delete this.openRoleAccordions[roleName];
                  }
                });
                Object.keys(this.editingRoleStates).forEach(key => {
                  if (key === roleName) {
                    this.editingRoleStates[updatedRoleFromServer.name] = this.editingRoleStates[roleName];
                    delete this.editingRoleStates[roleName];
                  }
                });
                Object.keys(this.roleTemporaryPermissions).forEach(key => {
                  if (key === roleName) {
                    this.roleTemporaryPermissions[updatedRoleFromServer.name] = this.roleTemporaryPermissions[roleName];
                    delete this.roleTemporaryPermissions[roleName];
                  }
                });
                Object.keys(this.roleTemporaryDetails).forEach(key => {
                  if (key === roleName) {
                    this.roleTemporaryDetails[updatedRoleFromServer.name] = this.roleTemporaryDetails[roleName];
                    delete this.roleTemporaryDetails[roleName];
                  }
                });
              }
            }
            this.notification.success(
              'Thành công',
              `Cập nhật vai trò ${updatedRoleFromServer.name} thành công.`
            );
          } else {
            this.notification.error(
              'Thất bại',
              response.message || `Cập nhật vai trò ${this.roleTemporaryDetails[roleName].name} thất bại. Dữ liệu không hợp lệ.`
            );
            this.loadRoles();
          }
          this.editingRoleStates[this.roleTemporaryDetails[roleName].name] = false; // Use new name if it changed
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.notification.error(
            'Lỗi',
            err.error?.message || `Đã có lỗi xảy ra khi cập nhật vai trò ${this.roleTemporaryDetails[roleName].name}. Vui lòng thử lại.`
          );
          this.editingRoleStates[this.roleTemporaryDetails[roleName].name] = false;
        }
      });
    } else {
      this.notification.warning('Không có thay đổi hoặc dữ liệu không hợp lệ', 'Không có thay đổi nào được lưu hoặc dữ liệu tạm thời bị thiếu.');
      if (this.roleTemporaryDetails[roleName]) {
        this.editingRoleStates[this.roleTemporaryDetails[roleName].name] = false;
      } else {
        this.editingRoleStates[roleName] = false; // Fallback if temporary details are missing
      }
    }
  }

  cancelEdit(roleName: string): void {
    const originalRoleName = Object.keys(this.roleTemporaryDetails).find(key =>
      this.roleTemporaryDetails[key].name === roleName || key === roleName
    ) || roleName;

    this.editingRoleStates[originalRoleName] = false;
    // No need to explicitly delete temporary data, it will be overwritten on next edit or ignored
  }

  showDeleteConfirm(roleName: string, roleDescription: string): void {
    this.modal.confirm({
      nzTitle: `Xác nhận xóa vai trò "${roleName}"?`,
      nzContent: `Bạn có chắc chắn muốn xóa vai trò <strong>${roleDescription} (${roleName})</strong> không? Hành động này không thể hoàn tác.`,
      nzOkText: 'Xác nhận xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteRole(roleName),
      nzCancelText: 'Hủy',
      nzCentered: true,
      nzClassName: 'custom-confirm-modal' // For additional custom styling if needed
    });
  }

  deleteRole(roleName: string): void {
    this.roleService.deleteRole(roleName).subscribe({
      next: (response) => {
        // Assuming a successful delete might return a 204 No Content or a success message
        this.notification.success(
          'Thành công',
          `Vai trò ${roleName} đã được xóa thành công.`
        );
        this.roles = this.roles.filter(role => role.name !== roleName);
        // Clean up states for the deleted role
        delete this.openRoleAccordions[roleName];
        delete this.editingRoleStates[roleName];
        delete this.roleTemporaryPermissions[roleName];
      },
      error: (err) => {
        console.error('Error deleting role:', err);
        this.notification.error(
          'Lỗi',
          err.error?.message || `Đã có lỗi xảy ra khi xóa vai trò ${roleName}. Vui lòng thử lại.`
        );
      }
    });
  }

  /**
   * Show create role modal
   */
  showCreateRoleModal(): void {
    this.isCreateModalVisible = true;
    this.newRoleName = '';
  }

  /**
   * Handle create role modal cancel
   */
  handleCreateRoleCancel(): void {
    this.isCreateModalVisible = false;
    this.newRoleName = '';
    this.isCreatingRole = false;
  }

  /**
   * Handle create role modal OK (create the role)
   */
  handleCreateRoleOk(): void {
    if (!this.newRoleName.trim()) {
      this.notification.warning('Tên không hợp lệ', 'Vui lòng nhập tên vai trò.');
      return;
    }

    this.isCreatingRole = true;

    const newRole = {
      name: this.newRoleName.trim(),
      description: `Vai trò ${this.newRoleName.trim()}`,
      permissions: []
    };

    this.roleService.createRole(newRole).subscribe({
      next: (response) => {
        if (response.code === 1000 && response.data) {
          this.notification.success(
            'Thành công',
            `Tạo vai trò ${response.data.name} thành công.`
          );
          this.loadRoles(); // Reload the roles list
          this.isCreatingRole = false;
          this.isCreateModalVisible = false;
          this.newRoleName = '';
        } else {
          this.notification.error(
            'Thất bại',
            response.message || 'Tạo vai trò thất bại. Dữ liệu không hợp lệ.'
          );
          this.isCreatingRole = false;
        }
      },
      error: (err) => {
        console.error('Error creating role:', err);
        this.notification.error(
          'Lỗi',
          err.error?.message || 'Đã có lỗi xảy ra khi tạo vai trò. Vui lòng thử lại.'
        );
        this.isCreatingRole = false;
      }
    });
  }

  toggleRolePermission(roleName: string, permissionName: string): void {
    if (this.editingRoleStates[roleName] && this.roleTemporaryPermissions[roleName]) {
      this.roleTemporaryPermissions[roleName][permissionName] = !this.roleTemporaryPermissions[roleName][permissionName];
    }
  }

  /**
   * Toggle accordion open/close
   */
  toggleTestAccordion(): void {
    this.isTestAccordionOpen = !this.isTestAccordionOpen;
  }

  /**
   * Toggle role accordion open/close
   */
  toggleRoleAccordion(roleName: string): void {
    this.openRoleAccordions[roleName] = !this.openRoleAccordions[roleName];
  }

  /**
   * Toggle permission state (just for UI demonstration)
   */
  togglePermission(permissionName: string): void {
    this.permissionStates[permissionName] = !this.permissionStates[permissionName];
  }

  /**
   * Get count of selected permissions
   */
  getSelectedPermissionsCount(): number {
    return Object.values(this.permissionStates).filter(state => state).length;
  }

  /**
   * Select all permissions
   */
  selectAllPermissions(): void {
    this.permissions.forEach(permission => {
      this.permissionStates[permission.name] = true;
    });
  }

  /**
   * Deselect all permissions
   */
  deselectAllPermissions(): void {
    this.permissions.forEach(permission => {
      this.permissionStates[permission.name] = false;
    });
  }
}
