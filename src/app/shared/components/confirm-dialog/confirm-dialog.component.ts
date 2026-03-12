import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Label for the affirmative button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
}

/**
 * Generic confirmation dialog.
 *
 * Returns `true` when the user confirms, `false` when cancelled.
 *
 * Usage:
 *   const ref = this.dialog.open(ConfirmDialogComponent, {
 *     data: { title: 'Complete Work Order', message: 'This cannot be undone.' },
 *   });
 *   ref.afterClosed().subscribe(confirmed => { if (confirmed) { ... } });
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button mat-flat-button (click)="dialogRef.close(true)">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  protected readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
