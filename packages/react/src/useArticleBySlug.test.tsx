import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useArticleBySlug } from "./useArticleBySlug.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchArticleBySlug: vi.fn(),
}));

import { fetchArticleBySlug } from "@skyscribe-sdk/core";
const mockFetch = vi.mocked(fetchArticleBySlug);

const article = {
  title: "Hello World",
  content: "<p>Hi</p>",
  path: "/blog/essays/hello-world",
  site: "at://did:plc:test/site.standard.publication/3mp4nd46xwr2h",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const uri = "at://did:plc:test/site.standard.document/3mp47vvkh342n";

beforeEach(() => mockFetch.mockReset());

describe("useArticleBySlug", () => {
  it("looks the article up by slug and returns it with its AT URI", async () => {
    mockFetch.mockResolvedValueOnce({ article, uri });
    const { result } = renderHook(() =>
      useArticleBySlug("did:plc:test", "https://example.com", "hello-world")
    );
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.article).toEqual(article);
    expect(result.current.uri).toBe(uri);
    expect(mockFetch).toHaveBeenCalledWith(
      "did:plc:test",
      "https://example.com",
      "hello-world",
      expect.any(AbortSignal)
    );
  });

  it("sets error on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Article not found: missing"));
    const { result } = renderHook(() =>
      useArticleBySlug("did:plc:test", "https://example.com", "missing")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Article not found: missing");
    expect(result.current.article).toBeNull();
    expect(result.current.uri).toBeNull();
  });

  it("re-fetches and aborts the previous request when the slug changes", async () => {
    mockFetch.mockResolvedValue({ article, uri });
    const { result, rerender } = renderHook(
      ({ slug }: { slug: string }) =>
        useArticleBySlug("did:plc:test", "https://example.com", slug),
      { initialProps: { slug: "post-one" } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstSignal = mockFetch.mock.calls[0][3] as AbortSignal;

    rerender({ slug: "post-two" });
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenLastCalledWith(
      "did:plc:test",
      "https://example.com",
      "post-two",
      expect.any(AbortSignal)
    );
  });

  it("ignores AbortError", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    mockFetch.mockRejectedValueOnce(abortError);
    const { result } = renderHook(() =>
      useArticleBySlug("did:plc:test", "https://example.com", "x")
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.error).toBeNull();
  });
});
