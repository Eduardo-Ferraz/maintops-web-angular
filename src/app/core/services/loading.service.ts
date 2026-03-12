import { computed, Injectable, signal } from '@angular/core';

/**
 * Tracks in-flight HTTP requests to drive a global loading indicator.
 *
 * The LoadingInterceptor calls increment()/decrement() around every request.
 * Components that need to show a progress bar inject this service and bind
 * to `isLoading()`.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _count = signal(0);

  /** True while at least one HTTP request is in flight. */
  readonly isLoading = computed(() => this._count() > 0);

  increment(): void {
    this._count.update((c) => c + 1);
  }

  decrement(): void {
    this._count.update((c) => Math.max(0, c - 1));
  }
}
