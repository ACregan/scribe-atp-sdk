// Thrown when a fetch succeeded but the record genuinely doesn't exist
// (site/publication/article lookup came back empty). Callers should treat
// this as a real 404 — retrying won't help.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Thrown for anything that looks transient: network failure, non-ok HTTP
// response, or handle/DID/PDS resolution failure. Safe to retry.
export class PdsFetchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PdsFetchError";
  }
}
