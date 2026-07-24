import { PdsUnreachableError } from "./errors.js";

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || (error as { code?: number }).code === 20)
  );
}

// Wraps the global fetch() to distinguish "the PDS responded, just with an
// error" (caller checks res.ok and throws PdsFetchError, unchanged) from
// "we couldn't reach the PDS at all" (DNS failure, connection refused,
// timeout — fetch() itself rejects). An aborted request is rethrown
// unchanged so existing AbortError handling keeps working.
export async function pdsFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new PdsUnreachableError(`Could not reach PDS: ${url}`, { cause: error });
  }
}
