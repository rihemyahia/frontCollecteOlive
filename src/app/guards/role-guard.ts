import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userRole = authService.getUserRole()?.toUpperCase();
  const requiredRole = route.data['role'];

  console.log('User role:', userRole);
  console.log('Required role:', requiredRole);

  if (!userRole) return false;

  // ✅ handle array of roles
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  // ✅ handle single role
  return userRole === requiredRole?.toUpperCase();
};