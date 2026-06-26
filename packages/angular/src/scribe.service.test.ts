import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScribeService } from "./scribe.service.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
  fetchArticle: vi.fn(),
  fetchArticleBySlug: vi.fn(),
  resolvePublicationUri: vi.fn(),
}));

import { fetchSite, fetchArticle, fetchArticleBySlug, resolvePublicationUri } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticle = vi.mocked(fetchArticle);
const mockFetchArticleBySlug = vi.mocked(fetchArticleBySlug);
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const site = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  title: "Test Site",
  url: "example.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

const article = {
  title: "Test Article",
  content: "<p>Hello</p>",
  path: "/test-article",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  mockFetchSite.mockReset();
  mockFetchArticle.mockReset();
  mockFetchArticleBySlug.mockReset();
  mockResolvePublicationUri.mockReset();
});

describe("ScribeService", () => {
  describe("getSite", () => {
    it("emits site and completes on success", () =>
      new Promise<void>((resolve) => {
        mockFetchSite.mockResolvedValueOnce(site);
        const service = new ScribeService();
        service.getSite("did:plc:test", "example-com").subscribe({
          next: (value) => expect(value).toEqual(site),
          complete: resolve,
        });
      }));

    it("errors on fetch failure", () =>
      new Promise<void>((resolve) => {
        mockFetchSite.mockRejectedValueOnce(new Error("Network error"));
        const service = new ScribeService();
        service.getSite("did:plc:test", "example-com").subscribe({
          error: (err: Error) => {
            expect(err.message).toBe("Network error");
            resolve();
          },
        });
      }));

    it("aborts fetch on unsubscribe", () => {
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      const { promise, reject } = Promise.withResolvers<typeof site>();
      mockFetchSite.mockReturnValueOnce(promise);
      const service = new ScribeService();
      const sub = service.getSite("did:plc:test", "example-com").subscribe();
      sub.unsubscribe();
      expect(abortSpy).toHaveBeenCalled();
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      abortSpy.mockRestore();
    });

    it("does not error on AbortError after unsubscribe", () =>
      new Promise<void>((resolve, reject) => {
        const { promise, reject: rejectPromise } =
          Promise.withResolvers<typeof site>();
        mockFetchSite.mockReturnValueOnce(promise);
        const service = new ScribeService();
        const sub = service.getSite("did:plc:test", "example-com").subscribe({
          error: () => reject(new Error("should not error")),
          complete: resolve,
        });
        sub.unsubscribe();
        rejectPromise(Object.assign(new Error("aborted"), { name: "AbortError" }));
        setTimeout(resolve, 10);
      }));
  });

  describe("getArticle", () => {
    it("emits article and completes on success", () =>
      new Promise<void>((resolve) => {
        mockFetchArticle.mockResolvedValueOnce(article);
        const service = new ScribeService();
        service.getArticle("did:plc:test", "test-article").subscribe({
          next: (value) => expect(value).toEqual(article),
          complete: resolve,
        });
      }));

    it("errors on fetch failure", () =>
      new Promise<void>((resolve) => {
        mockFetchArticle.mockRejectedValueOnce(new Error("Not found"));
        const service = new ScribeService();
        service.getArticle("did:plc:test", "test-article").subscribe({
          error: (err: Error) => {
            expect(err.message).toBe("Not found");
            resolve();
          },
        });
      }));

    it("aborts fetch on unsubscribe", () => {
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      const { promise, reject } = Promise.withResolvers<typeof article>();
      mockFetchArticle.mockReturnValueOnce(promise);
      const service = new ScribeService();
      const sub = service
        .getArticle("did:plc:test", "test-article")
        .subscribe();
      sub.unsubscribe();
      expect(abortSpy).toHaveBeenCalled();
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      abortSpy.mockRestore();
    });
  });

  describe("getPublicationUri", () => {
    it("emits uri and completes on success", () =>
      new Promise<void>((resolve) => {
        mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
        const service = new ScribeService();
        service.getPublicationUri("did:plc:test", "my-blog").subscribe({
          next: (value) => expect(value).toBe("at://did:plc:test/site.standard.publication/my-blog"),
          complete: resolve,
        });
      }));

    it("errors on failure", () =>
      new Promise<void>((resolve) => {
        mockResolvePublicationUri.mockRejectedValueOnce(new Error("failed"));
        const service = new ScribeService();
        service.getPublicationUri("did:plc:test", "my-blog").subscribe({
          error: (err: Error) => {
            expect(err.message).toBe("failed");
            resolve();
          },
        });
      }));

    it("aborts on unsubscribe", () => {
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      const { promise, reject } = Promise.withResolvers<string>();
      mockResolvePublicationUri.mockReturnValueOnce(promise);
      const service = new ScribeService();
      const sub = service.getPublicationUri("did:plc:test", "my-blog").subscribe();
      sub.unsubscribe();
      expect(abortSpy).toHaveBeenCalled();
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      abortSpy.mockRestore();
    });
  });

  describe("getDocumentUri", () => {
    const DOCUMENT_URI = "at://did:plc:test/site.standard.document/3jxtctq7kqm2y";

    it("emits uri and completes on success", () =>
      new Promise<void>((resolve) => {
        mockFetchArticleBySlug.mockResolvedValueOnce({ article: {} as never, uri: DOCUMENT_URI });
        const service = new ScribeService();
        service.getDocumentUri("did:plc:test", "example-com", "hello").subscribe({
          next: (value) => expect(value).toBe(DOCUMENT_URI),
          complete: resolve,
        });
      }));

    it("errors on failure", () =>
      new Promise<void>((resolve) => {
        mockFetchArticleBySlug.mockRejectedValueOnce(new Error("failed"));
        const service = new ScribeService();
        service.getDocumentUri("did:plc:test", "example-com", "hello").subscribe({
          error: (err: Error) => {
            expect(err.message).toBe("failed");
            resolve();
          },
        });
      }));

    it("aborts on unsubscribe", () => {
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      const { promise, reject } = Promise.withResolvers<never>();
      mockFetchArticleBySlug.mockReturnValueOnce(promise);
      const service = new ScribeService();
      const sub = service.getDocumentUri("did:plc:test", "example-com", "hello").subscribe();
      sub.unsubscribe();
      expect(abortSpy).toHaveBeenCalled();
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      abortSpy.mockRestore();
    });
  });
});
