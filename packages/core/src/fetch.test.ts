import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSite, fetchArticle } from "./fetch.js";

vi.mock("./resolve.js", () => ({
  resolveIdentifier: vi.fn(async () => "did:plc:testuser"),
  resolvePds: vi.fn(async () => "https://pds.example.com"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => mockFetch.mockReset());

describe("fetchSite", () => {
  it("fetches a site record from the correct PDS URL", async () => {
    const site = {
      title: "Test Site",
      url: "example.com",
      urlPrefix: "blog",
      groups: [],
      ungroupedArticles: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: site }),
    });

    const result = await fetchSite("did:plc:testuser", "example-com");
    expect(result).toEqual(site);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("pds.example.com"),
      }),
      expect.any(Object)
    );
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(fetchSite("did:plc:testuser", "missing-slug")).rejects.toThrow(
      "Failed to fetch site"
    );
  });
});

describe("fetchArticle", () => {
  it("fetches an article record from the correct PDS URL", async () => {
    const article = {
      title: "Hello World",
      content: "<p>Hi</p>",
      url: "hello-world",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: article }),
    });

    const result = await fetchArticle("did:plc:testuser", "hello-world");
    expect(result).toEqual(article);
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(
      fetchArticle("did:plc:testuser", "missing-article")
    ).rejects.toThrow("Failed to fetch article");
  });
});
