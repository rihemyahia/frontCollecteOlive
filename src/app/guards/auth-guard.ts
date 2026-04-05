import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    // Direct check on localStorage (more reliable than service method in some cases)
    const token = localStorage.getItem('token');

    if (token && token.length > 10) {   // basic sanity check
      return true;
    }

    // Redirect to login and remember where the user wanted to go
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
