import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectPublicationUri } from "./inject-publication-uri.js";

vi.mock("@scribe-atp/core", () => ({
  resolvePublicationUri: vi.fn(),
}));

import { resolvePublicationUri } from "@scribe-atp/core";
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const PUBLICATION_URI = "at://did:plc:test/site.standard.publication/my-blog";

beforeEach(() => mockResolvePublicationUri.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectPublicationUri", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<string>();
    mockResolvePublicationUri.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectPublicationUri("did:plc:test", "my-blog")
    );

    expect(result.loading()).toBe(true);
    expect(result.uri()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets uri on success", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce(PUBLICATION_URI);

    const result = TestBed.runInInjectionContext(() =>
      injectPublicationUri("did:plc:test", "my-blog")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.uri()).toBe(PUBLICATION_URI);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockResolvePublicationUri.mockRejectedValueOnce(new Error("Network error"));

    const result = TestBed.runInInjectionContext(() =>
      injectPublicationUri("did:plc:test", "my-blog")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Network error");
    expect(result.uri()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<string>();
    mockResolvePublicationUri.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectPublicationUri("did:plc:test", "my-blog")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
