export type WorkOrderStatus = 'Pending' | 'Scheduled' | 'InProgress' | 'Completed';
export type CriticalityLevel = 'Low' | 'Medium' | 'High';

// ─── Domain summary returned by GET /work-orders ────────────────────────────
export interface WorkOrderSummary {
  id: string;
  equipmentId: string;
  description: string;
  status: WorkOrderStatus;
  scheduleStartDate: string | null; // ISO 8601 UTC
  scheduleEndDate: string | null;   // ISO 8601 UTC
}

// ─── Pagination envelope returned by GET /work-orders ───────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── GET /work-orders query parameters ──────────────────────────────────────
export interface WorkOrdersQuery {
  equipmentId?: string;
  status?: WorkOrderStatus;
  descriptionContains?: string;
  page?: number;
  pageSize?: number;
}

// ─── POST /work-orders ───────────────────────────────────────────────────────
export interface SubmitWorkOrderCommand {
  equipmentId: string; // GUID string
  description: string; // max 1000 chars
}

export interface SubmitWorkOrderResponse {
  id: string;
  equipmentId: string;
  description: string;
  status: WorkOrderStatus;
}

// ─── PATCH /work-orders/{id}/schedule ───────────────────────────────────────
export interface ScheduleWorkOrderRequest {
  startDate: string; // ISO 8601 UTC — must be >= today, < endDate
  endDate: string;   // ISO 8601 UTC
}

export interface ScheduleWorkOrderResponse {
  id: string;
  status: WorkOrderStatus;
  scheduleStartDate: string;
  scheduleEndDate: string;
}

// ─── PATCH /work-orders/{id}/complete ───────────────────────────────────────
export interface CompleteWorkOrderResponse {
  id: string;
  status: WorkOrderStatus;
}

// ─── PATCH /work-orders/{id}/start (PEND-003 — backend endpoint pending) ────
export interface StartWorkOrderResponse {
  id: string;
  status: WorkOrderStatus; // expected: 'InProgress'
}
