import { describe, it, expect, vi, beforeEach } from "vitest";
import { pdsFetch } from "./http.js";
import { PdsUnreachableError } from "./errors.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("pdsFetch", () => {
  it("returns the Response as-is on success, including a non-ok response", async () => {
    const response = { ok: false, status: 500, statusText: "Server Error" };
    mockFetch.mockResolvedValueOnce(response);

    const result = await pdsFetch("https://example.com");

    expect(result).toBe(response);
  });

  it("wraps a connection-level failure in PdsUnreachableError", async () => {
    const cause = new TypeError("fetch failed");
    mockFetch.mockRejectedValueOnce(cause);

    const error = await pdsFetch("https://example.com").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PdsUnreachableError);
    expect((error as PdsUnreachableError).message).toContain("https://example.com");
    expect((error as PdsUnreachableError).cause).toBe(cause);
  });

  it("rethrows an AbortError unchanged", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    mockFetch.mockRejectedValueOnce(abortError);

    await expect(pdsFetch("https://example.com")).rejects.toBe(abortError);
  });
});
