import { describe, it, expect, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { createSiteLoader, createArticleRouteLoader, createWellKnownLoader } from "./loaders.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
  fetchArticleBySlug: vi.fn(),
  resolvePublicationUri: vi.fn(),
}));

import { fetchSite, fetchArticleBySlug, resolvePublicationUri } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticleBySlug = vi.mocked(fetchArticleBySlug);
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const makeArgs = (): LoaderFunctionArgs =>
  ({ request: new Request("https://example.com"), params: {}, context: {} }) as unknown as LoaderFunctionArgs;

const site = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  title: "Test Site",
  url: "example.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

const article = {
  title: "Hello",
  content: "<p>Hello</p>",
  path: "/essays/hello",
  site: "at://did:plc:test/site.standard.publication/example-com",
  canonicalUrl: "https://example.com/blog/essays/hello",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const documentUri = "at://did:plc:test/site.standard.document/3jxtctq7kqm2y";

describe("createSiteLoader", () => {
  it("returns a loader that fetches the site", async () => {
    mockFetchSite.mockResolvedValueOnce(site);
    const loader = createSiteLoader("did:plc:test", "example-com");
    const result = await loader(makeArgs());
    expect(result).toEqual(site);
    expect(mockFetchSite).toHaveBeenCalledWith(
      "did:plc:test",
      "example-com",
      expect.any(AbortSignal)
    );
  });

  it("passes the request signal to fetchSite", async () => {
    mockFetchSite.mockResolvedValueOnce(site);
    const loader = createSiteLoader("did:plc:test", "example-com");
    const args = makeArgs();
    await loader(args);
    expect(mockFetchSite).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      args.request.signal
    );
  });
});

describe("createArticleRouteLoader", () => {
  it("reads the slug from route params and returns article with documentUri", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    const result = await loader(args);
    expect(result).toEqual({ ...article, documentUri });
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith(
      "did:plc:test",
      "example-com",
      "hello",
      expect.any(AbortSignal)
    );
  });

  it("uses a custom param name when provided", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com", "slug");
    const args = { ...makeArgs(), params: { slug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith("did:plc:test", "example-com", "hello", expect.any(AbortSignal));
  });

  it("throws when the slug param is missing", async () => {
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    await expect(loader(makeArgs())).rejects.toThrow("Missing route param: articleSlug");
  });

  it("passes the request signal to fetchArticleBySlug", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      args.request.signal
    );
  });
});

describe("createWellKnownLoader", () => {
  it("returns a Response containing the publication AT URI", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
    const loader = createWellKnownLoader("did:plc:test", "my-blog");
    const response = await loader(makeArgs());
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe("at://did:plc:test/site.standard.publication/my-blog");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });

  it("passes the request signal to resolvePublicationUri", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
    const loader = createWellKnownLoader("did:plc:test", "my-blog");
    const args = makeArgs();
    await loader(args);
    expect(mockResolvePublicationUri).toHaveBeenCalledWith("did:plc:test", "my-blog", args.request.signal);
  });
});
