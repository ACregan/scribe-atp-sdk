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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: {
                domain: "example.com",
                basePath: "blog",
                title: "My Blog",
                groups: [],
                ungroupedArticles: [],
              },
            },
          },
        ],
      }),
    });

    const result = await listSites("alice.bsky.social");
    expect(result).toHaveLength(1);
    expect(result[0].uri).toBe("at://did:plc:testuser/site.standard.publication/example-com");
    expect(result[0].title).toBe("My Blog");
    expect(result[0].url).toBe("example.com");
    expect(result[0].urlPrefix).toBe("blog");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("com.atproto.repo.listRecords") }),
      expect.any(Object)
    );
  });

  it("fetches from site.standard.publication collection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: { domain: "example.com", basePath: "", title: "My Blog" },
            },
          },
        ],
      }),
    });

    await listSites("alice.bsky.social");
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
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/norobots-blog",
            cid: "bafy",
            value: {
              scribe: { domain: "norobots.blog", basePath: "posts", title: "NoRobots" },
            },
          },
        ],
      }),
    });

    const result = await listSites("did:plc:testuser");
    expect(result[0].url).toBe("norobots.blog");
    expect(result[0].urlPrefix).toBe("posts");
  });

  it("follows cursor across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.publication/site-one",
              cid: "bafy1",
              value: {
                scribe: { domain: "one.example.com", basePath: "", title: "Site One" },
              },
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
              uri: "at://did:plc:testuser/site.standard.publication/site-two",
              cid: "bafy2",
              value: {
                scribe: { domain: "two.example.com", basePath: "", title: "Site Two" },
              },
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
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: { domain: "example.com", basePath: "", title: "Test" },
            },
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
    await expect(listSites("did:plc:testuser")).rejects.toThrow("Failed to list site.standard.publication");
  });
});

describe("listArticles", () => {
  it("fetches all articles from site.standard.document collection", async () => {
    const rawDocument = {
      title: "Hello World",
      path: "/essays/hello-world",
      site: "at://did:plc:testuser/site.standard.publication/example-com",
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
              site: "at://did:plc:testuser/site.standard.publication/example-com",
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
                site: "at://did:plc:testuser/site.standard.publication/example-com",
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
                site: "at://did:plc:testuser/site.standard.publication/example-com",
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
              site: "at://did:plc:testuser/site.standard.publication/example-com",
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
