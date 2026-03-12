import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { WorkOrderService } from '../../../core/services/work-order.service';
import { ScheduleWorkOrderResponse } from '../../../shared/models/work-order.model';

export interface ScheduleDialogData {
  workOrderId: string;
}

/** Cross-field validator: endDate must be strictly after startDate. */
const endAfterStart: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const start = (group as FormGroup<{ startDate: FormControl<Date | null>; endDate: FormControl<Date | null> }>).controls.startDate.value;
  const end   = (group as FormGroup<{ startDate: FormControl<Date | null>; endDate: FormControl<Date | null> }>).controls.endDate.value;
  if (!start || !end) return null;
  return end > start ? null : { endBeforeStart: true };
};

/**
 * Dialog that schedules a work order via PATCH /work-orders/{id}/schedule.
 *
 * Closes with the ScheduleWorkOrderResponse on success, or null on cancel.
 *
 * Usage:
 *   const ref = this.dialog.open(ScheduleDialogComponent, {
 *     data: { workOrderId: row.id },
 *     width: '420px',
 *   });
 */
@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Schedule Work Order</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Start Date</mat-label>
          <input
            matInput
            [matDatepicker]="startPicker"
            formControlName="startDate"
          />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
          <mat-datepicker #startPicker />
          @if (form.controls.startDate.touched && form.controls.startDate.hasError('required')) {
            <mat-error>Start date is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>End Date</mat-label>
          <input
            matInput
            [matDatepicker]="endPicker"
            formControlName="endDate"
          />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
          <mat-datepicker #endPicker />
          @if (form.controls.endDate.touched && form.controls.endDate.hasError('required')) {
            <mat-error>End date is required.</mat-error>
          }
          @if (form.errors?.['endBeforeStart'] && form.controls.endDate.touched) {
            <mat-error>End date must be after start date.</mat-error>
          }
        </mat-form-field>

        <!-- Inline API error (e.g. DR-3 high-criticality overlap) -->
        @if (apiError()) {
          <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {{ apiError() }}
          </p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)" [disabled]="loading()">
        Cancel
      </button>
      <button
        mat-flat-button
        (click)="schedule()"
        [disabled]="loading() || form.invalid"
      >
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          Schedule
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class ScheduleDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ScheduleDialogComponent>);
  protected readonly data: ScheduleDialogData = inject(MAT_DIALOG_DATA);
  private readonly workOrderService = inject(WorkOrderService);

  protected readonly loading  = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly form = new FormGroup(
    {
      startDate: new FormControl<Date | null>(null, Validators.required),
      endDate:   new FormControl<Date | null>(null, Validators.required),
    },
    { validators: endAfterStart },
  );

  protected schedule(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.apiError.set(null);

    const { startDate, endDate } = this.form.value;
    this.workOrderService
      .scheduleWorkOrder(this.data.workOrderId, {
        startDate: startDate!.toISOString(),
        endDate:   endDate!.toISOString(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ScheduleWorkOrderResponse) => this.dialogRef.close(response),
        error: (err: HttpErrorResponse) => {
          // 422 = domain rule violation (e.g. DR-3 high-criticality overlap).
          // The errorInterceptor already shows a snackbar; show a persistent
          // inline message so the user knows what to fix while the dialog is open.
          if (err.status === 422) {
            this.apiError.set(
              (err.error as { detail?: string })?.detail ?? 'Business rule violation.',
            );
          }
        },
      });
  }
}
