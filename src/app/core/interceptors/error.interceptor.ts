import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ProblemDetails } from '../../shared/models/problem-details.model';

/**
 * Centrally handles all HTTP error responses from the backend.
 *
 * Backend error mapping (RFC 7807 ProblemDetails):
 *  400 – FluentValidation field errors   → parse `errors` dict, show per-field messages
 *  401 – JWT missing / expired           → redirect to /login
 *  404 – Resource not found              → show `detail` in snackbar
 *  422 – Domain rule violation           → show `detail` in snackbar (8 s)
 *  429 – Rate limit exceeded             → show retry message
 *  5xx – Unexpected server error         → show generic message
 *
 * After displaying the error, re-throws so feature code can react if needed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem = err.error as ProblemDetails | undefined;

      switch (err.status) {
        case 400: {
          const messages = problem?.errors
            ? Object.values(problem.errors).flat()
            : [problem?.detail ?? 'Validation failed.'];
          snackBar.open(messages.join(' · '), 'Close', {
            duration: 8000,
            panelClass: ['snack-warn'],
          });
          break;
        }

        case 401:
          router.navigate(['/login']);
          break;

        case 404:
          snackBar.open(
            problem?.detail ?? 'The requested resource was not found.',
            'Close',
            { duration: 5000 },
          );
          break;

        case 422:
          snackBar.open(
            problem?.detail ?? 'Business rule violation.',
            'Close',
            { duration: 8000, panelClass: ['snack-error'] },
          );
          break;

        case 429:
          snackBar.open(
            'Too many requests. Please wait and try again.',
            'Close',
            { duration: 6000 },
          );
          break;

        default:
          snackBar.open('An unexpected error occurred.', 'Close', {
            duration: 5000,
          });
      }

      return throwError(() => err);
    }),
  );
};
