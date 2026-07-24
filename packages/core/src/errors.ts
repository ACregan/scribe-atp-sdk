// Thrown when a fetch succeeded but the record genuinely doesn't exist
// (site/publication/article lookup came back empty). Callers should treat
// this as a real 404 — retrying won't help.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Thrown when a request reached the PDS but it responded with an error
// (non-ok HTTP status). The service is up — this particular operation
// failed. Safe to retry.
export class PdsFetchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PdsFetchError";
  }
}

// Thrown when a request never got a response at all — DNS failure,
// connection refused, timeout. Distinct from PdsFetchError (which means the
// PDS responded, just with an error): this means the PDS couldn't be
// reached at all. Extends PdsFetchError so existing `instanceof
// PdsFetchError` checks still match; check `instanceof PdsUnreachableError`
// first for the more specific case. Safe to retry.
export class PdsUnreachableError extends PdsFetchError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PdsUnreachableError";
  }
}
