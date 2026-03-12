/**
 * RFC 7807 Problem Details shape returned by the backend's GlobalExceptionHandler.
 *
 * Status mapping:
 *  400 – FluentValidation failure  → `errors` extension is populated
 *  401 – Unauthorized
 *  404 – Resource not found
 *  422 – Domain rule violation     → `detail` carries the rule message
 *  429 – Rate limit exceeded
 *  500 – Unexpected server error
 */
export interface ProblemDetails {
  status: number;
  title: string;
  detail: string;
  instance: string;
  /** Field-level validation errors — only present on HTTP 400. */
  errors?: Record<string, string[]>;
}
