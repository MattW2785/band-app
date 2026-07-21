export type ErrorClass = "TRANSIENT" | "PERMANENT";

export class PublishError extends Error {
  errorClass: ErrorClass;
  httpStatus?: number;

  constructor(message: string, errorClass: ErrorClass, httpStatus?: number) {
    super(message);
    this.name = "PublishError";
    this.errorClass = errorClass;
    this.httpStatus = httpStatus;
  }
}

export function classifyHttpStatus(status: number): ErrorClass {
  if (status === 429 || status >= 500) return "TRANSIENT";
  return "PERMANENT";
}

export const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 5, 15, 30];

export function nextAttemptDelayMs(attemptCount: number): number {
  const minutes = BACKOFF_MINUTES[Math.min(attemptCount - 1, BACKOFF_MINUTES.length - 1)];
  return minutes * 60 * 1000;
}
