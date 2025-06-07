import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from './auth.service';

export interface Permission {
    name: string;
    description: string;
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
}
