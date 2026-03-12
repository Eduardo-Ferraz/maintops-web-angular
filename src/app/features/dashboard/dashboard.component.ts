import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import {
  catchError,
  forkJoin,
  map,
  merge,
  of,
  Subject,
  switchMap,
  timer,
} from 'rxjs';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { WorkOrderService } from '../../core/services/work-order.service';
import { LoadingService } from '../../core/services/loading.service';
import { SubmitWorkOrderDialogComponent } from '../work-orders/dialogs/submit-work-order-dialog.component';
import {
  SubmitWorkOrderResponse,
  WorkOrderSummary,
} from '../../shared/models/work-order.model';

interface DashboardData {
  totalCount: number;
  pendingCount: number;
  scheduledCount: number;
  completedCount: number;
  recent: WorkOrderSummary[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    KpiCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button mat-flat-button (click)="openNewWorkOrderDialog()">
          <mat-icon>add</mat-icon>
          New Work Order
        </button>
      </div>

      <!-- Global loading bar driven by LoadingService -->
      @if (loadingSvc.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (data(); as d) {
        <!-- KPI cards -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <app-kpi-card label="Total"     [value]="d.totalCount"     icon="assignment"    />
          <app-kpi-card label="Pending"   [value]="d.pendingCount"   icon="hourglass_top" />
          <app-kpi-card label="Scheduled" [value]="d.scheduledCount" icon="event"         />
          <app-kpi-card label="Completed" [value]="d.completedCount" icon="check_circle"  />
        </div>

        <!-- Recent work orders table -->
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-700">Recent Work Orders</h2>
          @if (d.recent.length > 0) {
            <table mat-table [dataSource]="d.recent" class="w-full shadow-sm">
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let row" class="max-w-xs truncate">
                  {{ row.description }}
                </td>
              </ng-container>

              <ng-container matColumnDef="equipmentId">
                <th mat-header-cell *matHeaderCellDef>Equipment ID</th>
                <td mat-cell *matCellDef="let row" class="font-mono text-xs text-gray-500">
                  {{ row.equipmentId }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <app-status-badge [status]="row.status" />
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          } @else {
            <p class="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              No work orders found. Create one with the button above.
            </p>
          }
        </div>
      } @else {
        <p class="py-16 text-center text-gray-400">Loading dashboard data…</p>
      }
    </div>
  `,
})
export class DashboardComponent {
  private readonly workOrderService = inject(WorkOrderService);
  private readonly dialog = inject(MatDialog);
  protected readonly loadingSvc = inject(LoadingService);

  protected readonly displayedColumns = ['description', 'equipmentId', 'status'];

  /** Trigger an immediate refresh without waiting for the next 30 s cycle. */
  private readonly refresh$ = new Subject<void>();

  private readonly data$ = merge(timer(0, 30_000), this.refresh$).pipe(
    switchMap(() =>
      forkJoin({
        all: this.workOrderService
          .getWorkOrders({ page: 1, pageSize: 5 })
          .pipe(catchError(() => of(null))),
        pending: this.workOrderService
          .getWorkOrders({ status: 'Pending', pageSize: 1 })
          .pipe(catchError(() => of(null))),
        scheduled: this.workOrderService
          .getWorkOrders({ status: 'Scheduled', pageSize: 1 })
          .pipe(catchError(() => of(null))),
        completed: this.workOrderService
          .getWorkOrders({ status: 'Completed', pageSize: 1 })
          .pipe(catchError(() => of(null))),
      }),
    ),
    map(({ all, pending, scheduled, completed }) => ({
      totalCount:     all?.totalCount       ?? 0,
      pendingCount:   pending?.totalCount   ?? 0,
      scheduledCount: scheduled?.totalCount ?? 0,
      completedCount: completed?.totalCount ?? 0,
      recent:         all?.items            ?? [],
    } satisfies DashboardData)),
  );

  protected readonly data = toSignal(this.data$);

  protected openNewWorkOrderDialog(): void {
    this.dialog
      .open(SubmitWorkOrderDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((result: SubmitWorkOrderResponse | null) => {
        if (result) {
          this.refresh$.next();
        }
      });
  }
}
