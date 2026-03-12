import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DatePipe } from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SubmitWorkOrderDialogComponent } from '../dialogs/submit-work-order-dialog.component';
import { ScheduleDialogComponent } from '../dialogs/schedule-dialog.component';
import { WorkOrderService } from '../../../core/services/work-order.service';
import { LoadingService } from '../../../core/services/loading.service';
import {
  PagedResult,
  WorkOrderStatus,
  WorkOrderSummary,
} from '../../../shared/models/work-order.model';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    StatusBadgeComponent,
    DatePipe,
  ],
  template: `
    <div class="p-6 space-y-4">
      <!-- Page header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-gray-800">Work Orders</h1>
        <button mat-flat-button (click)="openSubmitDialog()">
          <mat-icon>add</mat-icon>
          New Work Order
        </button>
      </div>

      <!-- Filter bar -->
      <div class="flex flex-wrap gap-3">
        <mat-form-field appearance="outline" class="w-56">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusFilter">
            <mat-option value="">All</mat-option>
            <mat-option value="Pending">Pending</mat-option>
            <mat-option value="Scheduled">Scheduled</mat-option>
            <mat-option value="InProgress">In Progress</mat-option>
            <mat-option value="Completed">Completed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="flex-1 min-w-48">
          <mat-label>Search description</mat-label>
          <input matInput [formControl]="searchControl" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Loading bar -->
      @if (loadingSvc.isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Data table -->
      @if (result(); as r) {
        <table mat-table [dataSource]="r.items" class="w-full shadow-sm">
          <!-- Description -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let row" class="max-w-xs">
              <span class="line-clamp-2 text-sm">{{ row.description }}</span>
            </td>
          </ng-container>

          <!-- Equipment ID -->
          <ng-container matColumnDef="equipmentId">
            <th mat-header-cell *matHeaderCellDef>Equipment ID</th>
            <td mat-cell *matCellDef="let row" class="font-mono text-xs text-gray-500">
              {{ row.equipmentId }}
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <app-status-badge [status]="row.status" />
            </td>
          </ng-container>

          <!-- Schedule dates -->
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

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="whitespace-nowrap">
              <!-- Schedule button: Pending or Scheduled can be rescheduled -->
              @if (canSchedule(row)) {
                <button
                  mat-icon-button
                  matTooltip="Schedule"
                  (click)="openScheduleDialog(row)"
                >
                  <mat-icon>event</mat-icon>
                </button>
              }

              <!-- Start button: Scheduled → InProgress (PEND-003: endpoint pending) -->
              @if (canStart(row)) {
                <button
                  mat-icon-button
                  matTooltip="Start work order"
                  (click)="startWorkOrder(row)"
                >
                  <mat-icon>play_arrow</mat-icon>
                </button>
              }

              <!-- Complete button: Scheduled or InProgress (DR-1: Pending cannot complete) -->
              @if (canComplete(row)) {
                <button
                  mat-icon-button
                  matTooltip="Mark as completed"
                  (click)="confirmComplete(row)"
                >
                  <mat-icon>check_circle</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        <mat-paginator
          [length]="r.totalCount"
          [pageSize]="pageSize()"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        />
      } @else {
        <!-- Shimmer skeleton shown while the first query hasn't resolved yet -->
        <div class="animate-pulse space-y-2 rounded-lg border border-gray-100 p-4">
          <div class="h-4 w-1/4 rounded bg-gray-200"></div>
          @for (_ of [1,2,3,4,5]; track _) {
            <div class="h-12 rounded bg-gray-100"></div>
          }
        </div>
      }
    </div>
  `,
})
export class WorkOrderListComponent {
  private readonly workOrderService = inject(WorkOrderService);
  private readonly dialog = inject(MatDialog);
  protected readonly loadingSvc = inject(LoadingService);

  protected readonly displayedColumns = [
    'description',
    'equipmentId',
    'status',
    'schedule',
    'actions',
  ];

  // ── Filter controls ──────────────────────────────────────────────────────────
  protected readonly statusFilter = new FormControl<WorkOrderStatus | ''>('');
  protected readonly searchControl = new FormControl('');

  // ── Pagination signals ────────────────────────────────────────────────────────
  protected readonly page     = signal(1);
  protected readonly pageSize = signal(10);

  // ── Manual refresh trigger ────────────────────────────────────────────────────
  private readonly refresh$ = new Subject<void>();

  // ── Signal mirrors for reactive query (signals have initial values) ──────────
  private readonly debouncedSearch = signal('');
  private readonly statusSignal    = signal<WorkOrderStatus | ''>('');

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((v) => {
        this.debouncedSearch.set(v ?? '');
        this.page.set(1);
      });

    this.statusFilter.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        this.statusSignal.set(v ?? '');
        this.page.set(1);
      });
  }

  // ── Derived query → data$ → result signal ────────────────────────────────────
  // combineLatest requires all sources to emit; using signals (via toObservable)
  // ensures an immediate emission on subscription.
  private readonly query$ = combineLatest([
    toObservable(this.page),
    toObservable(this.pageSize),
    toObservable(this.debouncedSearch),
    toObservable(this.statusSignal),
  ]);

  private readonly data$ = merge(this.query$, this.refresh$).pipe(
    switchMap(() =>
      this.workOrderService
        .getWorkOrders({
          page:               this.page(),
          pageSize:           this.pageSize(),
          status:              (this.statusSignal() as WorkOrderStatus) || undefined,
          descriptionContains: this.debouncedSearch() || undefined,
        })
        .pipe(catchError(() => of(null))),
    ),
  );

  protected readonly result = toSignal(this.data$);

  // ── Domain-rule helpers ───────────────────────────────────────────────────────
  protected canSchedule(row: WorkOrderSummary): boolean {
    return row.status === 'Pending' || row.status === 'Scheduled';
  }

  /** DR-1: Pending cannot be completed directly. */
  protected canComplete(row: WorkOrderSummary): boolean {
    return row.status === 'Scheduled' || row.status === 'InProgress';
  }

  /** PEND-003: Scheduled orders can be started (Scheduled → InProgress). */
  protected canStart(row: WorkOrderSummary): boolean {
    return row.status === 'Scheduled';
  }

  // ── Pagination handler ────────────────────────────────────────────────────────
  protected onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  // ── Dialog openers ────────────────────────────────────────────────────────────
  protected openSubmitDialog(): void {
    this.dialog
      .open(SubmitWorkOrderDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refresh$.next();
      });
  }

  protected openScheduleDialog(row: WorkOrderSummary): void {
    this.dialog
      .open(ScheduleDialogComponent, {
        data: { workOrderId: row.id },
        width: '420px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refresh$.next();
      });
  }

  protected confirmComplete(row: WorkOrderSummary): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title:        'Complete Work Order',
          message:      'Mark this work order as completed? This cannot be undone.',
          confirmLabel: 'Complete',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.workOrderService
          .completeWorkOrder(row.id)
          .subscribe(() => this.refresh$.next());
      });
  }

  /** PEND-003: will return 404 until the backend exposes PATCH /work-orders/{id}/start. */
  protected startWorkOrder(row: WorkOrderSummary): void {
    this.workOrderService
      .startWorkOrder(row.id)
      .subscribe(() => this.refresh$.next());
  }
}
