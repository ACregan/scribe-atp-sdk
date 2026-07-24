import { NotFoundError } from "./errors.js";

export interface RetryOptions {
  /** Total attempts including the first. Default 5. */
  attempts?: number;
  /** Delay in ms before each retry (index 0 = delay before attempt 2). Default [300, 600, 1200, 2400]. */
  delaysMs?: number[];
  signal?: AbortSignal;
}

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_DELAYS_MS = [300, 600, 1200, 2400];

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || (error as { code?: number }).code === 20)
  );
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// Generic retry wrapper for any @scribe-atp/core fetch call. Never retries
// NotFoundError (the record genuinely doesn't exist — retrying can't help)
// or an aborted signal; retries everything else, including plain Errors
// from callers that haven't adopted the typed errors yet.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  const delaysMs = options?.delaysMs ?? DEFAULT_DELAYS_MS;
  const signal = options?.signal;

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException("Aborted", "AbortError");
    }
    try {
      return await fn();
    } catch (error) {
      if (error instanceof NotFoundError || isAbortError(error)) throw error;
      lastError = error;
      if (attempt < attempts - 1) {
        await wait(delaysMs[attempt] ?? delaysMs[delaysMs.length - 1], signal);
      }
    }
  }
  throw lastError;
}
