import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  styles: [`
    .nav-link.active-link {
      background-color: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
    }
  `],
  template: `
    @if (authService.isAuthenticated()) {
      <!-- Authenticated shell: persistent sidenav + top toolbar -->
      <mat-sidenav-container class="h-screen">

        <mat-sidenav mode="side" [opened]="sidenavOpen()" class="w-56">
          <div class="p-4 pb-2">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Navigation
            </p>
          </div>
          <mat-nav-list>
            <a
              mat-list-item
              routerLink="/dashboard"
              routerLinkActive="active-link"
              class="nav-link"
            >
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a
              mat-list-item
              routerLink="/work-orders"
              routerLinkActive="active-link"
              class="nav-link"
            >
              <mat-icon matListItemIcon>assignment</mat-icon>
              <span matListItemTitle>Work Orders</span>
            </a>
            <a
              mat-list-item
              routerLink="/equipment"
              routerLinkActive="active-link"
              class="nav-link"
            >
              <mat-icon matListItemIcon>precision_manufacturing</mat-icon>
              <span matListItemTitle>Equipment</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <!-- Top toolbar -->
          <mat-toolbar color="primary" class="flex items-center gap-1">
            <button
              mat-icon-button
              (click)="sidenavOpen.update(v => !v)"
              aria-label="Toggle navigation"
            >
              <mat-icon>menu</mat-icon>
            </button>
            <span class="flex-1 text-base font-semibold">MaintOps</span>
            <button
              mat-icon-button
              matTooltip="Logout"
              (click)="logout()"
              aria-label="Logout"
            >
              <mat-icon>logout</mat-icon>
            </button>
          </mat-toolbar>

          <!-- Global loading bar below toolbar -->
          @if (loadingSvc.isLoading()) {
            <mat-progress-bar mode="indeterminate" />
          }

          <!-- Page content -->
          <main class="overflow-auto">
            <router-outlet />
          </main>
        </mat-sidenav-content>

      </mat-sidenav-container>
    } @else {
      <!-- Unauthenticated: bare router-outlet (login page) -->
      <router-outlet />
    }
  `,
})
export class App {
  protected readonly authService = inject(AuthService);
  protected readonly loadingSvc  = inject(LoadingService);
  private  readonly router       = inject(Router);

  protected readonly sidenavOpen = signal(true);

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
