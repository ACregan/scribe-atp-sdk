import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectDocumentUri } from "./inject-document-uri.js";

vi.mock("@scribe-atp/core", () => ({
  resolveDocumentUri: vi.fn(),
}));

import { resolveDocumentUri } from "@scribe-atp/core";
const mockResolveDocumentUri = vi.mocked(resolveDocumentUri);

const DOCUMENT_URI = "at://did:plc:test/site.standard.document/hello";

beforeEach(() => mockResolveDocumentUri.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectDocumentUri", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<string>();
    mockResolveDocumentUri.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "hello")
    );

    expect(result.loading()).toBe(true);
    expect(result.uri()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets uri on success", async () => {
    mockResolveDocumentUri.mockResolvedValueOnce(DOCUMENT_URI);

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "hello")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.uri()).toBe(DOCUMENT_URI);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockResolveDocumentUri.mockRejectedValueOnce(new Error("Network error"));

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "hello")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Network error");
    expect(result.uri()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<string>();
    mockResolveDocumentUri.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "hello")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
