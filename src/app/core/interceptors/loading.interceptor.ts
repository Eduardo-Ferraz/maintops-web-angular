import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

import { LoadingService } from '../services/loading.service';

/**
 * Increments the global loading counter when a request starts and decrements
 * it when the request completes (success, error, or cancellation).
 *
 * Registered in app.config.ts after errorInterceptor so error handling runs
 * before the spinner is hidden.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.increment();
  return next(req).pipe(finalize(() => loading.decrement()));
};
