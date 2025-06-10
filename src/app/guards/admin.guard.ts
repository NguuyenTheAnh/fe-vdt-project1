import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {

    constructor(private userService: UserService, private router: Router) { } canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        // Kiểm tra nếu người dùng đã đăng nhập
        const currentUser = this.userService.getCurrentUser();

        if (currentUser && currentUser.role && currentUser.role.name !== 'USER') {
            return true;
        }

        // Nếu không phải admin, chuyển hướng về trang 404
        this.router.navigate(['/404']);
        return false;
    }
}
