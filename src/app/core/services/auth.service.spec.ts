import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AuthService } from './auth.service';

const TOKEN_KEY = 'maintops_jwt';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

const VALID_TOKEN   = makeJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) + 3600 });
const EXPIRED_TOKEN = makeJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) - 3600 });

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('is not authenticated with no token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('becomes authenticated after login() with a valid token', () => {
    service.login(VALID_TOKEN);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe(VALID_TOKEN);
  });

  it('persists the token to localStorage on login()', () => {
    service.login(VALID_TOKEN);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(VALID_TOKEN);
  });

  it('returns false for an expired token', () => {
    service.login(EXPIRED_TOKEN);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('returns null from getToken() for an expired token', () => {
    service.login(EXPIRED_TOKEN);
    expect(service.getToken()).toBeNull();
  });

  it('clears localStorage on getToken() when token is expired', () => {
    service.login(EXPIRED_TOKEN);
    service.getToken(); // triggers auto-logout
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('becomes unauthenticated after logout()', () => {
    service.login(VALID_TOKEN);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('returns false for a token with no exp claim', () => {
    const noExpToken = makeJwt({ sub: 'user1' }); // no exp field
    service.login(noExpToken);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('returns false for a completely malformed token', () => {
    service.login('not.a.jwt');
    expect(service.isAuthenticated()).toBe(false);
  });
});
