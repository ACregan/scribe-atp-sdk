import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectArticle } from "./inject-article.js";

vi.mock("@scribe-atp/core", () => ({
  fetchArticle: vi.fn(),
}));

import { fetchArticle } from "@scribe-atp/core";
const mockFetchArticle = vi.mocked(fetchArticle);

const article = {
  title: "Test Article",
  content: "<p>Hello</p>",
  path: "/test-article",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => mockFetchArticle.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectArticle", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<typeof article>();
    mockFetchArticle.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectArticle("did:plc:test", "test-article")
    );

    expect(result.loading()).toBe(true);
    expect(result.article()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets article data on success", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);

    const result = TestBed.runInInjectionContext(() =>
      injectArticle("did:plc:test", "test-article")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.article()).toEqual(article);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchArticle.mockRejectedValueOnce(new Error("Not found"));

    const result = TestBed.runInInjectionContext(() =>
      injectArticle("did:plc:test", "test-article")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Not found");
    expect(result.article()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof article>();
    mockFetchArticle.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectArticle("did:plc:test", "test-article")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
