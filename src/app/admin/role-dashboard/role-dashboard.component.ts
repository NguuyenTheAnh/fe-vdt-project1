import { Component, OnInit } from '@angular/core';
import { RoleService, Permission } from '../../services/role.service';

@Component({
  selector: 'app-role-dashboard',
  templateUrl: './role-dashboard.component.html',
  styleUrls: ['./role-dashboard.component.css']
})
export class RoleDashboardComponent implements OnInit {
  permissions: Permission[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Accordion state
  isTestAccordionOpen: boolean = false;

  // Permission toggle states (just for UI demonstration)
  permissionStates: { [key: string]: boolean } = {};

  constructor(private roleService: RoleService) { }

  ngOnInit(): void {
    this.loadPermissions();
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
   * Toggle accordion open/close
   */
  toggleTestAccordion(): void {
    this.isTestAccordionOpen = !this.isTestAccordionOpen;
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
