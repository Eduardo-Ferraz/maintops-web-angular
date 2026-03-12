import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let snackBar: MatSnackBar;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAnimations(),
        provideRouter([
          { path: 'login', component: class {} as never },
          { path: '**',    component: class {} as never },
        ]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http     = TestBed.inject(HttpClient);
    snackBar = TestBed.inject(MatSnackBar);
    router   = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('400: opens snackbar with validation detail from ProblemDetails', fakeAsync(() => {
    const openSpy = vi.spyOn(snackBar, 'open');
    http.get('/test').subscribe({ error: () => {} });

    httpMock.expectOne('/test').flush(
      { status: 400, title: 'Validation', detail: 'Email is invalid.', errors: { email: ['Email is invalid.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    tick();

    expect(openSpy).toHaveBeenCalled();
    const [message] = openSpy.mock.calls[0] as string[];
    expect(message).toContain('Email is invalid.');
  }));

  it('401: navigates to /login', fakeAsync(() => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    http.get('/test').subscribe({ error: () => {} });

    httpMock.expectOne('/test').flush(
      { status: 401, title: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('404: opens snackbar with not-found message', fakeAsync(() => {
    const openSpy = vi.spyOn(snackBar, 'open');
    http.get('/test').subscribe({ error: () => {} });

    httpMock.expectOne('/test').flush(
      { status: 404, title: 'Not Found', detail: 'Work order not found.' },
      { status: 404, statusText: 'Not Found' },
    );
    tick();

    expect(openSpy).toHaveBeenCalled();
    const [message] = openSpy.mock.calls[0] as string[];
    expect(message).toContain('not found');
  }));

  it('422: opens snackbar with business rule detail', fakeAsync(() => {
    const openSpy = vi.spyOn(snackBar, 'open');
    http.get('/test').subscribe({ error: () => {} });

    httpMock.expectOne('/test').flush(
      { status: 422, title: 'Business Rule', detail: 'Pending work orders cannot be completed (DR-1).' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    tick();

    expect(openSpy).toHaveBeenCalled();
    const [message] = openSpy.mock.calls[0] as string[];
    expect(message).toContain('DR-1');
  }));

  it('500: opens snackbar with a generic fallback message', fakeAsync(() => {
    const openSpy = vi.spyOn(snackBar, 'open');
    http.get('/test').subscribe({ error: () => {} });

    httpMock.expectOne('/test').flush(
      'Internal Server Error',
      { status: 500, statusText: 'Internal Server Error' },
    );
    tick();

    expect(openSpy).toHaveBeenCalled();
    const [message] = openSpy.mock.calls[0] as string[];
    expect(message).toContain('unexpected error');
  }));
});
