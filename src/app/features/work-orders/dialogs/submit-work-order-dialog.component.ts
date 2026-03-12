import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { WorkOrderService } from '../../../core/services/work-order.service';
import { SubmitWorkOrderResponse } from '../../../shared/models/work-order.model';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dialog that creates a new work order via POST /work-orders.
 *
 * Closes with the SubmitWorkOrderResponse on success, or null on cancel.
 *
 * Usage:
 *   const ref = this.dialog.open(SubmitWorkOrderDialogComponent, { width: '480px' });
 *   ref.afterClosed().subscribe((res: SubmitWorkOrderResponse | null) => { ... });
 */
@Component({
  selector: 'app-submit-work-order-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>New Work Order</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Equipment ID</mat-label>
          <input
            matInput
            formControlName="equipmentId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
          <mat-hint>Paste the equipment GUID (see PEND-004)</mat-hint>
          @if (form.controls.equipmentId.touched) {
            @if (form.controls.equipmentId.hasError('required')) {
              <mat-error>Equipment ID is required.</mat-error>
            } @else if (form.controls.equipmentId.hasError('pattern')) {
              <mat-error>Must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).</mat-error>
            }
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="4"
            maxlength="1000"
          ></textarea>
          <mat-hint align="end">
            {{ form.controls.description.value.length }} / 1000
          </mat-hint>
          @if (form.controls.description.touched) {
            @if (form.controls.description.hasError('required')) {
              <mat-error>Description is required.</mat-error>
            } @else if (form.controls.description.hasError('maxlength')) {
              <mat-error>Cannot exceed 1000 characters.</mat-error>
            }
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)" [disabled]="loading()">
        Cancel
      </button>
      <button
        mat-flat-button
        (click)="submit()"
        [disabled]="loading() || form.invalid"
      >
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          Create
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class SubmitWorkOrderDialogComponent {
  protected readonly dialogRef =
    inject(MatDialogRef<SubmitWorkOrderDialogComponent>);
  private readonly workOrderService = inject(WorkOrderService);

  protected readonly loading = signal(false);

  protected readonly form = new FormGroup({
    equipmentId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(UUID_PATTERN)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { equipmentId, description } = this.form.getRawValue();
    this.workOrderService
      .submitWorkOrder({ equipmentId, description })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((response: SubmitWorkOrderResponse) => {
        this.dialogRef.close(response);
      });
  }
}
