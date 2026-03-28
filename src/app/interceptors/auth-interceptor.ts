import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  console.log('🔐 INTERCEPTEUR ACTIF !');
  console.log('🔐 Token:', token ? token.substring(0, 50) + '...' : 'NON');
  console.log('🔐 URL:', req.url);

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
