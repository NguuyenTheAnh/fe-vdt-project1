import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserData } from './auth.service';

// Interface for user list response
export interface User {
    id: number;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    address: string | null;
    accountStatus: 'ACTIVE' | 'INACTIVE';
    createdAt: string | null;
    updatedAt: string | null;
    role: {
        name: string;
        description: string;
    };
}

export interface UserListResponse {
    content: User[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface GetUsersParams {
    page: number;
    size: number;
    name?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<UserData | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // BehaviorSubject để theo dõi quá trình khởi tạo
    private appInitializedSubject = new BehaviorSubject<boolean>(false);
    public appInitialized$ = this.appInitializedSubject.asObservable();

    constructor(private apiService: ApiService) { }    /**
     * Lấy thông tin profile của người dùng đang đăng nhập
     */    fetchCurrentUserProfile(): Observable<UserData | null> {
        // Kiểm tra nếu có token thì mới gọi API
        const token = localStorage.getItem('authToken');
        const currentUser = this.currentUserSubject.value;

        if (!token) {
            console.log('No token found, cannot fetch profile');
            // Nếu không có token, xóa thông tin người dùng nếu có
            this.clearCurrentUser();
            return of(null);
        }

        console.log('Fetching current user profile from API');
        return this.apiService.get<UserData>('/auth/my-profile').pipe(
            tap(response => {
                if (response && response.code === 1000 && response.data) {
                    // Kết hợp thông tin người dùng với token và bảo toàn các trường khác nếu có
                    const userData: UserData = {
                        ...(currentUser || {}),  // Giữ lại các trường cũ nếu có
                        ...response.data,        // Cập nhật từ response mới
                        token: token             // Đảm bảo token được lưu cùng thông tin người dùng
                    };

                    // Đảm bảo thông tin vai trò được log ra để debug
                    console.log('User role from profile API:', userData.role ? userData.role.name : 'No role defined');

                    // Check if user is an admin
                    const isAdmin = !!(userData && userData.role && userData.role.name === 'ADMIN');
                    console.log('Is admin user:', isAdmin);

                    // Cập nhật thông tin người dùng vào BehaviorSubject
                    this.currentUserSubject.next(userData);

                    // Lưu thông tin người dùng vào localStorage
                    this.saveUserToLocalStorage(userData);

                    console.log('User profile updated and saved to localStorage');
                } else {
                    console.warn('Invalid user data from API:', response);
                    // Nếu API không trả về data hợp lệ nhưng vẫn có user data cũ, giữ nguyên
                    if (currentUser) {
                        console.log('Keeping existing user data');
                    } else {
                        console.warn('No existing user data, clearing authentication');
                        localStorage.removeItem('authToken');
                        this.clearCurrentUser();
                    }
                }
            }),
            // Map the ApiResponse<UserData> to UserData | null
            map(response => {
                if (response && response.code === 1000 && response.data) {
                    return {
                        ...(currentUser || {}),
                        ...response.data,
                        token: token
                    };
                }
                return null;
            }),
            catchError(error => {
                console.error('Error fetching user profile:', error);

                // Xử lý các lỗi xác thực
                if (error.status === 401 || error.status === 403) {
                    console.warn('Authentication error, clearing credentials');
                    localStorage.removeItem('authToken');
                    this.clearCurrentUser();
                    return of(null);
                }

                // Với các lỗi khác (như lỗi mạng), giữ nguyên thông tin hiện có và trả về user hiện tại
                console.log('Network or server error, keeping existing session if available');
                return of(currentUser);
            })
        );
    }

    /**
     * Lấy thông tin người dùng hiện tại
     */
    getCurrentUser(): UserData | null {
        return this.currentUserSubject.value;
    }    /**
     * Cập nhật thông tin người dùng trong local storage và state
     */
    updateCurrentUser(user: UserData): void {
        this.currentUserSubject.next(user);
        this.saveUserToLocalStorage(user);
    }

    /**
     * Cập nhật thông tin người dùng thông qua API
     */
    updateUserProfile(updateData: any): Observable<any> {
        return this.apiService.patch<any>('/users', updateData)
            .pipe(
                tap(response => {
                    if (response && response.code === 1000 && response.data) {
                        // Cập nhật thông tin người dùng hiện tại với dữ liệu mới
                        const currentUser = this.currentUserSubject.value;
                        if (currentUser) {
                            const updatedUser = {
                                ...currentUser,
                                ...response.data
                            };
                            this.updateCurrentUser(updatedUser);
                        }
                    }
                })
            );
    }

    /**
     * Xóa thông tin người dùng hiện tại (logout)
     */
    clearCurrentUser(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
    }

    /**
     * Kiểm tra xem có người dùng đang đăng nhập không
     */
    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    /**
     * Lưu thông tin người dùng vào localStorage
     */
    private saveUserToLocalStorage(user: UserData): void {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }    /**
     * Khởi tạo thông tin người dùng từ localStorage (gọi khi khởi động app)
     */
    initializeFromLocalStorage(): void {
        console.log('Initializing user from localStorage');

        const storedUser = localStorage.getItem('currentUser');
        const authToken = localStorage.getItem('authToken');

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);

                // Đảm bảo token trong user data khớp với token trong localStorage
                if (authToken && (!user.token || user.token !== authToken)) {
                    console.log('Updating token in user data to match localStorage');
                    user.token = authToken;
                    this.saveUserToLocalStorage(user);
                }

                // Ngay cả khi không có token, vẫn đặt user vào BehaviorSubject để hiển thị UI đúng
                // Việc xác thực token sẽ được xử lý sau bởi fetchCurrentUserProfile
                this.currentUserSubject.next(user);
                console.log('User initialized from localStorage:', user.fullName);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                if (authToken) {
                    console.log('Found valid token but corrupted user data');
                    // Không xóa token nếu có token hợp lệ
                } else {
                    localStorage.removeItem('currentUser');
                }
            }
        } else if (authToken) {
            // Có token nhưng không có user data, tạo user tạm thời để hiển thị UI đã đăng nhập
            console.log('Found token but no user data, creating temporary user');
            const tempUser: UserData = { token: authToken };
            this.currentUserSubject.next(tempUser);
            // fetchCurrentUserProfile sẽ được gọi từ AppComponent để lấy đầy đủ thông tin
        }

        // Đánh dấu quá trình khởi tạo hoàn tất
        this.appInitializedSubject.next(true);
    }

    /**
     * Cập nhật trạng thái khởi tạo của ứng dụng
     */
    setAppInitialized(value: boolean): void {
        console.log('App initialization status set to:', value);
        this.appInitializedSubject.next(value);
    }

    /**
     * Kiểm tra xem ứng dụng đã hoàn tất khởi tạo chưa
     */
    isAppInitialized(): boolean {
        return this.appInitializedSubject.value;
    }

    /**
     * Lấy danh sách tất cả người dùng với phân trang, tìm kiếm theo tên và trạng thái
     * @param params - Tham số truy vấn bao gồm page, size, name (tùy chọn), status (tùy chọn)
     * @returns Observable<UserListResponse | null>
     */
    getAllUsers(params: GetUsersParams): Observable<UserListResponse | null> {
        // Tạo query parameters
        const queryParams: { [key: string]: string } = {
            page: params.page.toString(),
            size: params.size.toString()
        };

        // Thêm tham số name nếu có
        if (params.name && params.name.trim()) {
            queryParams['name'] = params.name.trim();
        }

        // Thêm tham số status nếu có
        if (params.status) {
            queryParams['status'] = params.status;
        }

        // Chuyển đổi object thành query string
        const queryString = Object.keys(queryParams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
            .join('&');

        const url = `/users?${queryString}`;

        console.log('Fetching users with URL:', url);

        return this.apiService.get<UserListResponse>(url).pipe(
            map(response => {
                if (response && response.code === 1000 && response.data) {
                    console.log('Users fetched successfully:', response.data);
                    return response.data;
                } else {
                    console.warn('Invalid users data from API:', response);
                    return null;
                }
            }), catchError(error => {
                console.error('Error fetching users:', error);
                return of(null);
            })
        );
    }

    /**
     * Tạo người dùng mới
     * @param userData - Thông tin người dùng cần tạo
     * @returns Observable<User | null>
     */
    createUser(userData: {
        email: string;
        password: string;
        fullName: string;
        phoneNumber: string;
        roleName: string;
        address: string;
    }): Observable<User | null> {
        console.log('Creating new user:', userData);

        return this.apiService.post<User>('/users', userData).pipe(
            map(response => {
                if (response && response.code === 1000 && response.data) {
                    console.log('User created successfully:', response.data);
                    return response.data;
                } else {
                    console.warn('Invalid response from create user API:', response);
                    return null;
                }
            }),
            catchError(error => {
                console.error('Error creating user:', error);
                return of(null);
            })
        );
    }

    /**
     * Lấy thông tin chi tiết người dùng theo ID
     * @param userId - ID của người dùng cần lấy thông tin
     * @returns Observable<User | null>
     */
    getUserById(userId: number): Observable<User | null> {
        console.log('Fetching user by ID:', userId);

        return this.apiService.get<User>(`/users/${userId}`).pipe(
            map(response => {
                if (response && response.code === 1000 && response.data) {
                    console.log('User fetched successfully:', response.data);
                    return response.data;
                } else {
                    console.warn('Invalid response from get user API:', response);
                    return null;
                }
            }),
            catchError(error => {
                console.error('Error fetching user by ID:', error);
                return of(null);
            })
        );
    }

    /**
     * Cập nhật trạng thái người dùng
     * @param userId - ID của người dùng cần cập nhật trạng thái
     * @param status - Trạng thái mới ('ACTIVE' hoặc 'INACTIVE')
     * @returns Observable<boolean> - true nếu cập nhật thành công, false nếu thất bại
     */
    updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE'): Observable<boolean> {
        console.log(`Updating user ${userId} status to:`, status);

        // Expecting a response like { code: 1000 } without a 'data' field for this specific endpoint
        return this.apiService.patch<any>(`/users/${userId}/status?status=${status}`, {}).pipe(
            map(response => {
                if (response && response.code === 1000) {
                    console.log('User status updated successfully via API.');
                    return true;
                } else {
                    console.warn('Failed to update user status or invalid response from API:', response);
                    return false;
                }
            }),
            catchError(error => {
                console.error('Error updating user status:', error);
                return of(false);
            })
        );
    }
}
