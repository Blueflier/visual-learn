// A simple implementation of the Circuit Breaker pattern

export enum CircuitBreakerState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

type CircuitBreakerOptions = {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // Time in ms to wait before moving from OPEN to HALF_OPEN
};

export class CircuitBreaker {
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private options: CircuitBreakerOptions;

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 10000, // 10 seconds
      ...options,
    };
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.lastFailureTime && Date.now() > this.lastFailureTime + this.options.timeout) {
        this.toHalfOpen();
      } else {
        throw new Error('CircuitBreaker is open. Requests are blocked.');
      }
    }

    // Handles both CLOSED and HALF_OPEN states
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.state === CircuitBreakerState.HALF_OPEN || this.failureCount >= this.options.failureThreshold) {
      this.toOpen();
    }
  }

  private onSuccess() {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.toClosed();
      }
    } else {
      // If we are in CLOSED state, any success resets the failure count
      this.failureCount = 0;
    }
  }

  private toClosed() {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log('CircuitBreaker: State -> CLOSED');
  }

  private toOpen() {
    this.state = CircuitBreakerState.OPEN;
    this.lastFailureTime = Date.now();
    this.successCount = 0; // Reset success count on trip
    console.log('CircuitBreaker: State -> OPEN');
  }

  private toHalfOpen() {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.successCount = 0;
    console.log('CircuitBreaker: State -> HALF_OPEN');
  }
} 