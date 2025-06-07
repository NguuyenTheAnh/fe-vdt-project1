import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';

export interface Permission {
    name: string;
    description: string;
}

export interface Role {
    name: string;
    description: string;
    permissions: Permission[];
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    constructor(private apiService: ApiService) { }

    /**
     * Lấy danh sách tất cả permissions
     * @returns Observable chứa danh sách permissions
     */
    getPermissions(): Observable<ApiResponse<Permission[]>> {
        return this.apiService.get<Permission[]>('/permissions');
    }

    /**
     * Lấy danh sách tất cả roles
     * @returns Observable chứa danh sách roles
     */
    getRoles(): Observable<ApiResponse<Role[]>> {
        return this.apiService.get<Role[]>('/roles');
    }

    /**
     * Cập nhật một vai trò
     * @param roleName Tên vai trò cần cập nhật
     * @param roleData Dữ liệu vai trò mới (tên, mô tả, danh sách tên quyền)
     * @returns Observable chứa phản hồi từ API
     */
    updateRole(roleName: string, roleData: { name: string; description: string; permissions: string[] }): Observable<ApiResponse<Role>> {
        return this.apiService.patch<Role>(`/roles/${roleName}`, roleData);
    }

    /**
     * Xóa một vai trò
     * @param roleName Tên vai trò cần xóa
     * @returns Observable chứa phản hồi từ API (thường là rỗng hoặc một thông báo thành công)
     */
    deleteRole(roleName: string): Observable<ApiResponse<any>> { // Assuming API returns some simple response or no content
        return this.apiService.delete<any>(`/roles/${roleName}`);
    }

    /**
     * Tạo một vai trò mới
     * @param roleData Dữ liệu vai trò mới (tên, mô tả, danh sách quyền)
     * @returns Observable chứa phản hồi từ API
     */
    createRole(roleData: { name: string; description: string; permissions: string[] }): Observable<ApiResponse<Role>> {
        return this.apiService.post<Role>('/roles', roleData);
    }
}
