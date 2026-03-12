import { Component, computed, input } from '@angular/core';
import { WorkOrderStatus } from '../../models/work-order.model';

interface BadgeConfig {
  classes: string;
  label: string;
}

const STATUS_CONFIG: Record<WorkOrderStatus, BadgeConfig> = {
  Pending: {
    classes: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    label: 'Pending',
  },
  Scheduled: {
    classes: 'bg-blue-100 text-blue-700 ring-blue-700/10',
    label: 'Scheduled',
  },
  InProgress: {
    classes: 'bg-violet-100 text-violet-700 ring-violet-700/10',
    label: 'In Progress',
  },
  Completed: {
    classes: 'bg-green-100 text-green-700 ring-green-600/20',
    label: 'Completed',
  },
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
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="config().classes"
    >
      {{ config().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<WorkOrderStatus>();

  protected readonly config = computed(() => STATUS_CONFIG[this.status()]);
}
