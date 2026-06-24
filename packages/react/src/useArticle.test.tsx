import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useArticle } from "./useArticle.js";

vi.mock("@scribe-atp/core", () => ({
  fetchArticle: vi.fn(),
}));

import { fetchArticle } from "@scribe-atp/core";
const mockFetchArticle = vi.mocked(fetchArticle);

const article = {
  title: "Hello World",
  content: "<p>Hi</p>",
  path: "/hello-world",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => mockFetchArticle.mockReset());

describe("useArticle", () => {
  it("starts in loading state", async () => {
    const { promise, resolve } = Promise.withResolvers<typeof article>();
    mockFetchArticle.mockReturnValueOnce(promise);
    const { result } = renderHook(() =>
      useArticle("did:plc:test", "hello-world")
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.article).toBeNull();
    expect(result.current.error).toBeNull();
    resolve(article);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets article data on success", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    const { result } = renderHook(() =>
      useArticle("did:plc:test", "hello-world")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.article).toEqual(article);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchArticle.mockRejectedValueOnce(new Error("Not found"));
    const { result } = renderHook(() =>
      useArticle("did:plc:test", "missing-article")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Not found");
    expect(result.current.article).toBeNull();
  });

  it("re-fetches when params change", async () => {
    mockFetchArticle.mockResolvedValue(article);
    const { result, rerender } = renderHook(
      ({ author, slug }: { author: string; slug: string }) =>
        useArticle(author, slug),
      { initialProps: { author: "did:plc:test", slug: "post-one" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ author: "did:plc:test", slug: "post-two" });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchArticle).toHaveBeenCalledTimes(2);
  });

  it("aborts on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof article>();
    mockFetchArticle.mockReturnValueOnce(promise);
    const { unmount } = renderHook(() =>
      useArticle("did:plc:test", "hello-world")
    );
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
