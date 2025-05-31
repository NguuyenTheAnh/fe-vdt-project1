import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        // Kiểm tra nếu người dùng đã đăng nhập
        if (this.authService.isLoggedIn()) {
            return true;
        }

        // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
        this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });

        return false;
    }
}
