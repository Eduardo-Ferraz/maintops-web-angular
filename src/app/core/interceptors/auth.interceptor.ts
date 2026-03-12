import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT Bearer token to every outgoing request.
 * Skips the `/health` endpoint (public, no auth required).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/health')) {
    return next(req);
  }

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
