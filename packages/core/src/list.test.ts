import { describe, it, expect, vi, beforeEach } from "vitest";
import { listSites, listArticles } from "./list.js";

vi.mock("./resolve.js", () => ({
  resolveIdentifier: vi.fn(async () => "did:plc:testuser"),
  resolvePds: vi.fn(async () => "https://pds.example.com"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => mockFetch.mockReset());

describe("listSites", () => {
  it("fetches all sites from a single page response", async () => {
    const site = {
      title: "My Blog",
      url: "example.com",
      urlPrefix: "blog",
      groups: [],
      ungroupedArticles: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [{ uri: "at://did:plc:testuser/app.scribe.site/example-com", cid: "bafy", value: site }],
      }),
    });

    const result = await listSites("alice.bsky.social");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ uri: "at://did:plc:testuser/app.scribe.site/example-com", ...site });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("com.atproto.repo.listRecords") }),
      expect.any(Object)
    );
  });

  it("follows cursor across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/app.scribe.site/site-one",
              cid: "bafy1",
              value: { title: "Site One", url: "one.example.com", urlPrefix: "" },
            },
          ],
          cursor: "page2token",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/app.scribe.site/site-two",
              cid: "bafy2",
              value: { title: "Site Two", url: "two.example.com", urlPrefix: "" },
            },
          ],
        }),
      });

    const result = await listSites("did:plc:testuser");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Site One");
    expect(result[1].title).toBe("Site Two");

    const secondCall = mockFetch.mock.calls[1][0] as URL;
    expect(secondCall.searchParams.get("cursor")).toBe("page2token");
  });

  it("normalises missing groups and ungroupedArticles to empty arrays", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/app.scribe.site/example-com",
            cid: "bafy",
            value: { title: "Test", url: "example.com", urlPrefix: "" },
          },
        ],
      }),
    });

    const result = await listSites("did:plc:testuser");
    expect(result[0].groups).toEqual([]);
    expect(result[0].ungroupedArticles).toEqual([]);
  });

  it("returns an empty array when there are no site records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [] }),
    });

    const result = await listSites("did:plc:testuser");
    expect(result).toEqual([]);
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Forbidden" });
    await expect(listSites("did:plc:testuser")).rejects.toThrow("Failed to list app.scribe.site");
  });
});

describe("listArticles", () => {
  it("fetches all articles from site.standard.document collection", async () => {
    const rawDocument = {
      title: "Hello World",
      path: "/essays/hello-world",
      site: "https://example.com/blog",
      publishedAt: "2024-01-02T00:00:00Z",
      splashImageUrl: null,
      description: "A test article",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/hello-world",
            cid: "bafy",
            value: rawDocument,
          },
        ],
      }),
    });

    const result = await listArticles("alice.bsky.social");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uri: "at://did:plc:testuser/site.standard.document/hello-world",
      title: "Hello World",
      slug: "hello-world",
      splashImageUrl: null,
      description: "A test article",
      createdAt: "2024-01-01T00:00:00Z",
      publishedAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });
  });

  it("derives slug from the URI rkey", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/my-article-slug",
            cid: "bafy",
            value: {
              title: "Test",
              path: "/essays/my-article-slug",
              site: "https://example.com",
              publishedAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
      }),
    });

    const result = await listArticles("did:plc:testuser");
    expect(result[0].slug).toBe("my-article-slug");
  });

  it("follows cursor across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.document/first",
              cid: "bafy1",
              value: {
                title: "First",
                path: "/first",
                site: "https://example.com",
                publishedAt: "2024-01-01T00:00:00Z",
                createdAt: "2024-01-01T00:00:00Z",
              },
            },
          ],
          cursor: "nextpage",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.document/second",
              cid: "bafy2",
              value: {
                title: "Second",
                path: "/second",
                site: "https://example.com",
                publishedAt: "2024-01-02T00:00:00Z",
                createdAt: "2024-01-02T00:00:00Z",
              },
            },
          ],
        }),
      });

    const result = await listArticles("did:plc:testuser");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("First");
    expect(result[1].title).toBe("Second");
  });

  it("normalises undefined splashImageUrl to null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/no-splash",
            cid: "bafy",
            value: {
              title: "No Splash",
              path: "/no-splash",
              site: "https://example.com",
              publishedAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
      }),
    });

    const result = await listArticles("did:plc:testuser");
    expect(result[0].splashImageUrl).toBeNull();
  });

  it("returns an empty array when there are no article records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [] }),
    });

    const result = await listArticles("did:plc:testuser");
    expect(result).toEqual([]);
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(listArticles("did:plc:testuser")).rejects.toThrow(
      "Failed to list site.standard.document"
    );
  });
});
