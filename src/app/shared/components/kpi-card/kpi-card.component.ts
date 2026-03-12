import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable KPI tile for the dashboard.
 *
 * Usage:
 *   <app-kpi-card label="Pending" [value]="pendingCount()" icon="pending_actions" />
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card appearance="outlined" class="h-full">
      <mat-card-content class="flex items-center gap-4 p-6">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50">
          <mat-icon class="text-indigo-600">{{ icon() }}</mat-icon>
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm text-gray-500">{{ label() }}</p>
          <p class="text-3xl font-bold leading-none">{{ value() }}</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon  = input.required<string>();
}
