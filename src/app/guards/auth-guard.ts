import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
    private platformId = inject(PLATFORM_ID);

  constructor(
    private authService: AuthService,
    private router: Router,

  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
if (!isPlatformBrowser(this.platformId)) {
      return this.router.createUrlTree(['/login']);
    }
    // Direct check on localStorage (more reliable than service method in some cases)
    const token = this.authService.getToken();

    if (token && token.length > 10) {   // basic sanity check
      return true;
    }

    // Redirect to login and remember where the user wanted to go
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
