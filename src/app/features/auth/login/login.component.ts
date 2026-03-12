import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <mat-card class="w-full max-w-md" appearance="outlined">
        <mat-card-header class="mb-2">
          <mat-card-title class="text-2xl font-bold">MaintOps</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="flex flex-col gap-4"
          >
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              <mat-icon matPrefix class="mr-2">email</mat-icon>
              @if (form.controls.email.touched) {
                @if (form.controls.email.hasError('required')) {
                  <mat-error>Email is required.</mat-error>
                } @else if (form.controls.email.hasError('email')) {
                  <mat-error>Enter a valid email address.</mat-error>
                }
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="hidePassword() ? 'password' : 'text'"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.set(!hidePassword())"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.touched && form.controls.password.hasError('required')) {
                <mat-error>Password is required.</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              type="submit"
              class="w-full"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign In
              }
            </button>
          </form>

          <!--
            DEV BYPASS — only rendered in development builds.
            Paste a JWT from jwt.io (signed with the dev secret in appsettings.json)
            to authenticate without a real login endpoint.
          -->
          @if (isDev) {
            <mat-divider class="my-6" />

            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Dev bypass
            </p>
            <p class="mb-3 text-xs text-gray-400">
              No auth endpoint exists yet. Paste a JWT signed with the dev secret to
              skip the login flow.
            </p>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Paste JWT token</mat-label>
              <textarea
                matInput
                rows="3"
                #devTokenInput
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              ></textarea>
            </mat-form-field>

            <button
              mat-stroked-button
              type="button"
              class="w-full"
              (click)="devLogin(devTokenInput.value)"
            >
              <mat-icon>developer_mode</mat-icon>
              Use this token
            </button>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  protected readonly hidePassword = signal(true);
  protected readonly loading = signal(false);
  protected readonly isDev = !environment.production;

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    // Redirect already-authenticated users away from the login page.
    if (this.authService.isAuthenticated()) {
      void this.redirectAfterLogin();
    }
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();
    this.authService
      .loginWithCredentials(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.redirectAfterLogin(),
        // 401 (wrong credentials) is handled centrally by errorInterceptor.
      });
  }

  protected devLogin(token: string): void {
    const trimmed = token.trim();
    if (!trimmed) return;
    this.authService.login(trimmed);
    void this.redirectAfterLogin();
  }

  private redirectAfterLogin(): Promise<boolean> {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    return this.router.navigateByUrl(returnUrl);
  }
}
