import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteWorkOrderResponse,
  PagedResult,
  ScheduleWorkOrderRequest,
  ScheduleWorkOrderResponse,
  StartWorkOrderResponse,
  SubmitWorkOrderCommand,
  SubmitWorkOrderResponse,
  WorkOrdersQuery,
  WorkOrderSummary,
} from '../../shared/models/work-order.model';

/**
 * Wraps all four backend work-order endpoints.
 *
 * Error handling (400 / 401 / 404 / 422 / 429 / 500) is performed centrally
 * by errorInterceptor — no need to repeat it here.
 *
 * Callers should use `.pipe(finalize(...))` to reset loading state when they
 * need to re-enable UI after a failed request.
 */
@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/work-orders`;

  /**
   * GET /work-orders
   * All filter/pagination parameters are optional; omitted ones are not sent.
   *
   * Backend defaults: page=1, pageSize=20.
   * pageSize is capped at 100 by FluentValidation.
   */
  getWorkOrders(
    query: WorkOrdersQuery = {},
  ): Observable<PagedResult<WorkOrderSummary>> {
    let params = new HttpParams();

    if (query.equipmentId)        params = params.set('equipmentId', query.equipmentId);
    if (query.status)             params = params.set('status', query.status);
    if (query.descriptionContains) params = params.set('descriptionContains', query.descriptionContains);
    if (query.page != null)       params = params.set('page', query.page);
    if (query.pageSize != null)   params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResult<WorkOrderSummary>>(this.base, { params });
  }

  /**
   * POST /work-orders
   * Creates a new work order in Pending status.
   * Responds with 201 + SubmitWorkOrderResponse.
   *
   * Validation (400): equipmentId required, description required & ≤ 1000 chars.
   * Not-found (404): equipment must exist and be active.
   */
  submitWorkOrder(
    command: SubmitWorkOrderCommand,
  ): Observable<SubmitWorkOrderResponse> {
    return this.http.post<SubmitWorkOrderResponse>(this.base, command);
  }

  /**
   * PATCH /work-orders/{id}/schedule
   * Transitions a Pending or Scheduled work order to Scheduled.
   *
   * Validation (400): startDate required & ≥ today; endDate required & > startDate.
   * Domain rules (422):
   *   DR-2  – startDate must be before endDate (also enforced by validator).
   *   DR-2b – startDate cannot be in the past.
   *   DR-3  – High-criticality equipment cannot have overlapping schedules.
   *   DR-Reschedule – Cannot reschedule a Completed work order.
   */
  scheduleWorkOrder(
    id: string,
    request: ScheduleWorkOrderRequest,
  ): Observable<ScheduleWorkOrderResponse> {
    return this.http.patch<ScheduleWorkOrderResponse>(
      `${this.base}/${id}/schedule`,
      request,
    );
  }

  /**
   * PATCH /work-orders/{id}/complete
   * Transitions a Scheduled or InProgress work order to Completed.
   *
   * Domain rules (422):
   *   DR-1  – A Pending work order cannot be completed directly.
   *   DR-1b – An already-completed work order cannot be completed again.
   */
  completeWorkOrder(id: string): Observable<CompleteWorkOrderResponse> {
    // The backend expects no request body — only the route id matters.
    return this.http.patch<CompleteWorkOrderResponse>(
      `${this.base}/${id}/complete`,
      null,
    );
  }

  /**
   * PATCH /work-orders/{id}/start
   * Transitions a Scheduled work order to InProgress.
   *
   * NOTE: This endpoint does not exist yet on the backend (PEND-003).
   * The call will receive a 404 until the backend exposes the route.
   */
  startWorkOrder(id: string): Observable<StartWorkOrderResponse> {
    return this.http.patch<StartWorkOrderResponse>(
      `${this.base}/${id}/start`,
      null,
    );
  }
}
