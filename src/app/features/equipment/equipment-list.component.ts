import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { catchError, map, of, Subject, switchMap, timer, merge } from 'rxjs';

import { DatePipe } from '@angular/common';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SubmitWorkOrderDialogComponent } from '../work-orders/dialogs/submit-work-order-dialog.component';
import { WorkOrderService } from '../../core/services/work-order.service';
import { LoadingService } from '../../core/services/loading.service';
import {
  SubmitWorkOrderResponse,
  WorkOrderSummary,
} from '../../shared/models/work-order.model';

interface EquipmentGroup {
  equipmentId: string;
  orders: WorkOrderSummary[];
}

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    StatusBadgeComponent,
    DatePipe,
  ],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-gray-800">Equipment</h1>
        <button mat-flat-button (click)="openNewWorkOrderDialog()">
          <mat-icon>add</mat-icon>
          New Work Order
        </button>
      </div>

      <!-- PEND-004 notice -->
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div class="flex items-start gap-2">
          <mat-icon class="shrink-0 text-amber-500" style="font-size:18px; width:18px; height:18px">
            info
          </mat-icon>
          <p>
            <strong>No equipment endpoint available (PEND-004).</strong>
            Work orders are grouped here by Equipment ID from the
            <code class="rounded bg-amber-100 px-1">/work-orders</code> feed.
            Once a <code class="rounded bg-amber-100 px-1">GET /equipment</code>
            endpoint is added to the backend this view will be updated.
          </p>
        </div>
      </div>

      <!-- Loading bar -->
      @if (loadingSvc.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Groups -->
      @if (groups(); as gs) {
        @if (gs.length > 0) {
          @for (group of gs; track group.equipmentId) {
            <section class="rounded-lg border border-gray-200 bg-white shadow-sm">
              <header class="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <mat-icon class="text-gray-400">precision_manufacturing</mat-icon>
                <span class="font-mono text-sm font-semibold text-gray-700">
                  {{ group.equipmentId }}
                </span>
                <span class="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {{ group.orders.length }} order{{ group.orders.length === 1 ? '' : 's' }}
                </span>
              </header>

              <table mat-table [dataSource]="group.orders" class="w-full">
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let row" class="max-w-xs truncate text-sm">
                    {{ row.description }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <app-status-badge [status]="row.status" />
                  </td>
                </ng-container>

                <ng-container matColumnDef="schedule">
                  <th mat-header-cell *matHeaderCellDef>Schedule</th>
                  <td mat-cell *matCellDef="let row" class="text-xs text-gray-500">
                    @if (row.scheduleStartDate) {
                      {{ row.scheduleStartDate | date: 'mediumDate' }}
                      –
                      {{ row.scheduleEndDate | date: 'mediumDate' }}
                    } @else {
                      <span class="italic text-gray-300">—</span>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </section>
          }
        } @else {
          <p class="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            No work orders found. Create one with the button above.
          </p>
        }
      } @else {
        <p class="py-16 text-center text-gray-400">Loading equipment data…</p>
      }
    </div>
  `,
})
export class EquipmentListComponent {
  private readonly workOrderService = inject(WorkOrderService);
  private readonly dialog = inject(MatDialog);
  protected readonly loadingSvc = inject(LoadingService);

  protected readonly displayedColumns = ['description', 'status', 'schedule'];

  private readonly refresh$ = new Subject<void>();

  private readonly groups$ = merge(timer(0, 60_000), this.refresh$).pipe(
    switchMap(() =>
      this.workOrderService
        .getWorkOrders({ pageSize: 100 })
        .pipe(catchError(() => of(null))),
    ),
    map((result) => {
      if (!result) return [];
      const grouped = new Map<string, WorkOrderSummary[]>();
      for (const order of result.items) {
        const existing = grouped.get(order.equipmentId) ?? [];
        existing.push(order);
        grouped.set(order.equipmentId, existing);
      }
      return Array.from(grouped.entries()).map(
        ([equipmentId, orders]) => ({ equipmentId, orders } satisfies EquipmentGroup),
      );
    }),
  );

  protected readonly groups = toSignal(this.groups$);

  protected openNewWorkOrderDialog(): void {
    this.dialog
      .open(SubmitWorkOrderDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((result: SubmitWorkOrderResponse | null) => {
        if (result) this.refresh$.next();
      });
  }
}
