import { inject, Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'maintops_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly _token = signal<string | null>(this._loadPersistedToken());

  /** True when a non-expired JWT is present in storage. */
  readonly isAuthenticated = computed(() => {
    const t = this._token();
    return t !== null && !this._isExpired(t);
  });

  /**
   * Persists the token and updates the reactive state.
   * Called after a successful login response (or dev-mode bypass).
   */
  login(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  /**
   * Sends credentials to POST /auth/login and stores the returned JWT.
   *
   * NOTE: The backend endpoint does not exist yet (PEND-001).
   * This method will receive a 404 until the backend exposes the endpoint.
   * The errorInterceptor surfaces 401 (wrong credentials) as a snackbar.
   */
  loginWithCredentials(email: string, password: string): Observable<void> {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ token }) => this.login(token)),
        map(() => void 0),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }

  /**
   * Returns the stored token if it exists and is not expired.
   * Clears storage and resets signal if the token is expired.
   */
  getToken(): string | null {
    const t = this._token();
    if (!t) return null;

    if (this._isExpired(t)) {
      this.logout();
      return null;
    }

    return t;
  }

  private _loadPersistedToken(): string | null {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored || this._isExpired(stored)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored;
  }

  private _isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return typeof payload.exp === 'number'
        ? Date.now() >= payload.exp * 1000
        : true;
    } catch {
      return true;
    }
  }
}
