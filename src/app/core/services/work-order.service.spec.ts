import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { WorkOrderService } from './work-order.service';
import {
  PagedResult,
  ScheduleWorkOrderResponse,
  SubmitWorkOrderResponse,
  WorkOrderSummary,
} from '../../shared/models/work-order.model';

const BASE = '/api/work-orders';

const mockSummary = (overrides: Partial<WorkOrderSummary> = {}): WorkOrderSummary => ({
  id:                '00000000-0000-0000-0000-000000000001',
  equipmentId:       '00000000-0000-0000-0000-000000000002',
  description:       'Test work order',
  status:            'Pending',
  scheduleStartDate: null,
  scheduleEndDate:   null,
  ...overrides,
});

const mockPaged = (items: WorkOrderSummary[] = []): PagedResult<WorkOrderSummary> => ({
  items,
  totalCount: items.length,
  page:       1,
  pageSize:   10,
  totalPages: 1,
});

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkOrderService,
      ],
    });
    service  = TestBed.inject(WorkOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getWorkOrders ────────────────────────────────────────────────────────────

  it('getWorkOrders() calls GET /api/work-orders with no params by default', () => {
    service.getWorkOrders().subscribe();
    const req = httpMock.expectOne(r => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockPaged());
  });

  it('getWorkOrders({ status, page }) passes query params', () => {
    service.getWorkOrders({ status: 'Pending', page: 2, pageSize: 5 }).subscribe();
    const req = httpMock.expectOne(r => r.url === BASE);
    expect(req.request.params.get('status')).toBe('Pending');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('5');
    req.flush(mockPaged());
  });

  it('getWorkOrders() omits undefined filter fields', () => {
    service.getWorkOrders({ status: undefined, equipmentId: undefined }).subscribe();
    const req = httpMock.expectOne(r => r.url === BASE);
    expect(req.request.params.has('status')).toBe(false);
    expect(req.request.params.has('equipmentId')).toBe(false);
    req.flush(mockPaged());
  });

  // ── submitWorkOrder ──────────────────────────────────────────────────────────

  it('submitWorkOrder() calls POST /api/work-orders with command body', () => {
    const cmd = { equipmentId: 'eq-id', description: 'Fix pump' };
    let response!: SubmitWorkOrderResponse;
    service.submitWorkOrder(cmd).subscribe((r) => (response = r));

    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cmd);

    const mockResponse: SubmitWorkOrderResponse = {
      id:          'wo-id',
      equipmentId: 'eq-id',
      description: 'Fix pump',
      status:      'Pending',
    };
    req.flush(mockResponse);
    expect(response).toEqual(mockResponse);
  });

  // ── scheduleWorkOrder ────────────────────────────────────────────────────────

  it('scheduleWorkOrder() calls PATCH /api/work-orders/{id}/schedule', () => {
    const id  = 'wo-123';
    const req_body = { startDate: '2026-04-01T00:00:00.000Z', endDate: '2026-04-15T00:00:00.000Z' };
    let response!: ScheduleWorkOrderResponse;
    service.scheduleWorkOrder(id, req_body).subscribe((r) => (response = r));

    const req = httpMock.expectOne(`${BASE}/${id}/schedule`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(req_body);

    const mockResponse: ScheduleWorkOrderResponse = {
      id,
      status:            'Scheduled',
      scheduleStartDate: req_body.startDate,
      scheduleEndDate:   req_body.endDate,
    };
    req.flush(mockResponse);
    expect(response).toEqual(mockResponse);
  });

  // ── completeWorkOrder ────────────────────────────────────────────────────────

  it('completeWorkOrder() calls PATCH /api/work-orders/{id}/complete with null body', () => {
    const id = 'wo-456';
    service.completeWorkOrder(id).subscribe();

    const req = httpMock.expectOne(`${BASE}/${id}/complete`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ id, status: 'Completed' });
  });
});
