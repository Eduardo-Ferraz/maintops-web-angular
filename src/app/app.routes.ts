import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'work-orders',
    loadComponent: () =>
      import(
        './features/work-orders/work-order-list/work-order-list.component'
      ).then((m) => m.WorkOrderListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'equipment',
    loadComponent: () =>
      import('./features/equipment/equipment-list.component').then(
        (m) => m.EquipmentListComponent,
      ),
    canActivate: [authGuard],
  },

  // Fallback — redirect unknown paths to login
  { path: '**', redirectTo: 'login' },
];
