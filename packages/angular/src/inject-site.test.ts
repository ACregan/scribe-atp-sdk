import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectSite } from "./inject-site.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
}));

import { fetchSite } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);

const site = {
  title: "Test Site",
  url: "example.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

beforeEach(() => mockFetchSite.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectSite", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectSite("did:plc:test", "example-com")
    );

    expect(result.loading()).toBe(true);
    expect(result.site()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets site data on success", async () => {
    mockFetchSite.mockResolvedValueOnce(site);

    const result = TestBed.runInInjectionContext(() =>
      injectSite("did:plc:test", "example-com")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.site()).toEqual(site);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchSite.mockRejectedValueOnce(new Error("Network error"));

    const result = TestBed.runInInjectionContext(() =>
      injectSite("did:plc:test", "example-com")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Network error");
    expect(result.site()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectSite("did:plc:test", "example-com")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
