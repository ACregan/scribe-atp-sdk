import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@scribe-atp/core", () => ({
  fetchArticleBySlug: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { fetchArticleBySlug } from "@scribe-atp/core";
import { useAsyncData } from "#app";
import { useScribeDocumentUri } from "./useScribeDocumentUri.js";

const mockFetchArticleBySlug = vi.mocked(fetchArticleBySlug);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeDocumentUri", () => {
  it("generates the correct useAsyncData key", () => {
    useScribeDocumentUri("alice.bsky.social", "alice-blog", "hello");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:document-uri:alice.bsky.social:alice-blog:hello",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls fetchArticleBySlug and returns the uri", async () => {
    const documentUri = "at://did:plc:abc/site.standard.document/3jxtctq7kqm2y";
    mockFetchArticleBySlug.mockResolvedValueOnce({ article: {} as never, uri: documentUri });
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeDocumentUri("alice.bsky.social", "alice-blog", "hello");
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith("alice.bsky.social", "alice-blog", "hello");
  });

  it("passes options through to useAsyncData", () => {
    useScribeDocumentUri("alice.bsky.social", "alice-blog", "hello", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: "at://did:plc:abc/site.standard.document/3jxtctq7kqm2y", pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribeDocumentUri("alice.bsky.social", "alice-blog", "hello");
    expect(result).toBe(mockReturn);
  });
});
