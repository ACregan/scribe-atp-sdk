import { describe, it, expect } from "vitest";
import { NotFoundError, PdsFetchError, PdsUnreachableError } from "./errors.js";

describe("NotFoundError", () => {
  it("is an Error with the right name and message", () => {
    const err = new NotFoundError("Article not found: foo");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toBe("Article not found: foo");
  });
});

describe("PdsFetchError", () => {
  it("is an Error with the right name and message", () => {
    const err = new PdsFetchError("Failed to fetch article: 500");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PdsFetchError);
    expect(err.name).toBe("PdsFetchError");
    expect(err.message).toBe("Failed to fetch article: 500");
  });

  it("preserves a cause", () => {
    const cause = new Error("network down");
    const err = new PdsFetchError("Failed to fetch article", { cause });
    expect(err.cause).toBe(cause);
  });
});

describe("PdsUnreachableError", () => {
  it("is a PdsFetchError with the right name and message", () => {
    const err = new PdsUnreachableError("Could not reach PDS: https://example.com");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PdsFetchError);
    expect(err).toBeInstanceOf(PdsUnreachableError);
    expect(err.name).toBe("PdsUnreachableError");
    expect(err.message).toBe("Could not reach PDS: https://example.com");
  });

  it("preserves a cause", () => {
    const cause = new TypeError("fetch failed");
    const err = new PdsUnreachableError("Could not reach PDS", { cause });
    expect(err.cause).toBe(cause);
  });
});
