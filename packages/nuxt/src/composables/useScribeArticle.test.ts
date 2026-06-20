import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@scribe-atp/core", () => ({
  fetchArticle: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { fetchArticle } from "@scribe-atp/core";
import { useAsyncData } from "#app";
import { useScribeArticle } from "./useScribeArticle.js";

const mockFetchArticle = vi.mocked(fetchArticle);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeArticle", () => {
  it("generates the correct useAsyncData key", () => {
    useScribeArticle("alice.bsky.social", "hello");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:article:alice.bsky.social:hello",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls fetchArticle with correct args", async () => {
    mockFetchArticle.mockResolvedValueOnce({ title: "Hello", content: "", url: "hello", createdAt: "", updatedAt: "" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeArticle("alice.bsky.social", "hello");
    expect(mockFetchArticle).toHaveBeenCalledWith("alice.bsky.social", "hello");
  });

  it("passes options through to useAsyncData", () => {
    useScribeArticle("alice.bsky.social", "hello", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: { title: "Hello" }, pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribeArticle("alice.bsky.social", "hello");
    expect(result).toBe(mockReturn);
  });
});
