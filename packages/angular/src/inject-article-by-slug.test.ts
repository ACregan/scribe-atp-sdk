import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { DestroyRef } from "@angular/core";
import { injectArticleBySlug } from "./inject-article-by-slug.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchArticleBySlug: vi.fn(),
}));

import { fetchArticleBySlug } from "@skyscribe-sdk/core";
const mockFetch = vi.mocked(fetchArticleBySlug);

const article = {
  title: "Test Article",
  content: "<p>Hello</p>",
  path: "/blog/essays/test-article",
  site: "at://did:plc:test/site.standard.publication/3mp4nd46xwr2h",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const uri = "at://did:plc:test/site.standard.document/3mp47vvkh342n";

beforeEach(() => mockFetch.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectArticleBySlug", () => {
  it("starts in loading state", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const result = TestBed.runInInjectionContext(() =>
      injectArticleBySlug("did:plc:test", "https://example.com", "test-article")
    );
    expect(result.loading()).toBe(true);
    expect(result.article()).toBeNull();
    expect(result.uri()).toBeNull();
  });

  it("sets the article and its AT URI on success", async () => {
    mockFetch.mockResolvedValueOnce({ article, uri });
    const result = TestBed.runInInjectionContext(() =>
      injectArticleBySlug("did:plc:test", "https://example.com", "test-article")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.loading()).toBe(false);
    expect(result.article()).toEqual(article);
    expect(result.uri()).toBe(uri);
    expect(mockFetch).toHaveBeenCalledWith(
      "did:plc:test",
      "https://example.com",
      "test-article",
      expect.any(AbortSignal)
    );
  });

  it("sets error on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Article not found: x"));
    const result = TestBed.runInInjectionContext(() =>
      injectArticleBySlug("did:plc:test", "https://example.com", "x")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Article not found: x");
  });

  it("aborts when the injection context is destroyed", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    TestBed.runInInjectionContext(() => {
      injectArticleBySlug("did:plc:test", "https://example.com", "x");
      return TestBed.inject(DestroyRef);
    });
    const signal = mockFetch.mock.calls[0][3] as AbortSignal;
    TestBed.resetTestingModule();
    expect(signal.aborted).toBe(true);
  });
});
