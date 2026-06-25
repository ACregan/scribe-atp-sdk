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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          scribe: {
            domain: "example.com",
            basePath: "blog",
            title: "Test Site",
            groups: [],
            ungroupedArticles: [],
          },
        },
      }),
    });

    const result = await fetchSite("did:plc:testuser", "example-com");
    expect(result.title).toBe("Test Site");
    expect(result.url).toBe("example.com");
    expect(result.urlPrefix).toBe("blog");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("pds.example.com"),
      }),
      expect.any(Object)
    );
  });

  it("fetches from site.standard.publication collection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          scribe: {
            domain: "example.com",
            basePath: "",
            title: "Test Site",
          },
        },
      }),
    });

    await fetchSite("did:plc:testuser", "example-com");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("site.standard.publication"),
      }),
      expect.any(Object)
    );
  });

  it("maps scribe.domain to url and scribe.basePath to urlPrefix", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          scribe: {
            domain: "norobots.blog",
            basePath: "posts",
            title: "NoRobots",
          },
        },
      }),
    });

    const result = await fetchSite("did:plc:testuser", "norobots-blog");
    expect(result.url).toBe("norobots.blog");
    expect(result.urlPrefix).toBe("posts");
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(fetchSite("did:plc:testuser", "missing-slug")).rejects.toThrow(
      "Failed to fetch site"
    );
  });

  it("normalises missing groups and ungroupedArticles to empty arrays", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          scribe: { domain: "example.com", basePath: "", title: "Test" },
        },
      }),
    });
    const result = await fetchSite("did:plc:testuser", "example-com");
    expect(result.groups).toEqual([]);
    expect(result.ungroupedArticles).toEqual([]);
  });
});

describe("fetchArticle", () => {
  it("fetches an article record from site.standard.document collection", async () => {
    const rawRecord = {
      title: "Hello World",
      content: { $type: "app.scribe.content.html", html: "<p>Hi</p>" },
      path: "/essays/hello-world",
      site: "at://did:plc:testuser/site.standard.publication/example-com",
      canonicalUrl: "https://example.com/blog/essays/hello-world",
      publishedAt: "2024-01-02T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: rawRecord }),
    });

    const result = await fetchArticle("did:plc:testuser", "hello-world");
    expect(result.title).toBe("Hello World");
    expect(result.content).toBe("<p>Hi</p>");
    expect(result.path).toBe("/essays/hello-world");
    expect(result.site).toBe("at://did:plc:testuser/site.standard.publication/example-com");
    expect(result.canonicalUrl).toBe("https://example.com/blog/essays/hello-world");
    expect(result.publishedAt).toBe("2024-01-02T00:00:00Z");
  });

  it("fetches from site.standard.document collection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/hello-world",
          site: "at://did:plc:testuser/site.standard.publication/example-com",
          publishedAt: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    await fetchArticle("did:plc:testuser", "hello-world");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("site.standard.document"),
      }),
      expect.any(Object)
    );
  });

  it("passes through canonicalUrl when present", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/example-com",
          canonicalUrl: "https://example.com/test",
          publishedAt: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "test");
    expect(result.canonicalUrl).toBe("https://example.com/test");
  });

  it("leaves canonicalUrl undefined when absent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/example-com",
          publishedAt: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "test");
    expect(result.canonicalUrl).toBeUndefined();
  });

  it("extracts html from app.scribe.content.html union", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "<p>Body</p>" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/example-com",
          publishedAt: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "test");
    expect(result.content).toBe("<p>Body</p>");
  });

  it("returns empty string for content when union type is unrecognised", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "some.other.type", data: "..." },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/example-com",
          publishedAt: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "test");
    expect(result.content).toBe("");
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(
      fetchArticle("did:plc:testuser", "missing-article")
    ).rejects.toThrow("Failed to fetch article");
  });
});
