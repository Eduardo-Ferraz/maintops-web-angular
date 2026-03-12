import { Component, computed, input } from '@angular/core';
import { WorkOrderStatus } from '../../models/work-order.model';

const BASE =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

const STATUS_CLASSES: Record<WorkOrderStatus, string> = {
  Pending:    'bg-amber-100 text-amber-800 ring-amber-600/20',
  Scheduled:  'bg-blue-100 text-blue-700 ring-blue-700/10',
  InProgress: 'bg-violet-100 text-violet-700 ring-violet-700/10',
  Completed:  'bg-green-100 text-green-700 ring-green-600/20',
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  Pending:    'Pending',
  Scheduled:  'Scheduled',
  InProgress: 'In Progress',
  Completed:  'Completed',
};

/**
 * Renders a color-coded pill badge for a WorkOrder status.
 *
 * Usage:
 *   <app-status-badge [status]="workOrder.status" />
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  // Single [class] binding builds the full class string so base layout
  // classes are never replaced by the color variant classes.
  template: `<span [class]="cssClass()">{{ label() }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<WorkOrderStatus>();

  protected readonly cssClass = computed(
    () => `${BASE} ${STATUS_CLASSES[this.status()]}`,
  );
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}

