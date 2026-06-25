import { describe, it, expect, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { createSiteLoader, createArticleLoader, createArticleRouteLoader, createWellKnownLoader } from "./loaders.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
  fetchArticle: vi.fn(),
  resolvePublicationUri: vi.fn(),
  resolveDocumentUri: vi.fn(),
}));

import { fetchSite, fetchArticle, resolvePublicationUri, resolveDocumentUri } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticle = vi.mocked(fetchArticle);
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);
const mockResolveDocumentUri = vi.mocked(resolveDocumentUri);

const makeArgs = (): LoaderFunctionArgs =>
  ({ request: new Request("https://example.com"), params: {}, context: {} }) as unknown as LoaderFunctionArgs;

const site = {
  title: "Test Site",
  url: "example.com",
  urlPrefix: "blog",
  groups: [],
  ungroupedArticles: [],
};

const article = {
  title: "Hello",
  content: "<p>Hello</p>",
  path: "/hello",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

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

describe("createArticleLoader", () => {
  it("returns a loader that fetches the article", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    const loader = createArticleLoader("did:plc:test", "hello");
    const result = await loader(makeArgs());
    expect(result).toEqual(article);
    expect(mockFetchArticle).toHaveBeenCalledWith(
      "did:plc:test",
      "hello",
      expect.any(AbortSignal)
    );
  });

  it("passes the request signal to fetchArticle", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    const loader = createArticleLoader("did:plc:test", "hello");
    const args = makeArgs();
    await loader(args);
    expect(mockFetchArticle).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      args.request.signal
    );
  });
});

describe("createArticleRouteLoader", () => {
  it("reads the slug from route params and returns article with documentUri", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    mockResolveDocumentUri.mockResolvedValueOnce("at://did:plc:test/site.standard.document/hello");
    const loader = createArticleRouteLoader("did:plc:test");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    const result = await loader(args);
    expect(result).toEqual({ ...article, documentUri: "at://did:plc:test/site.standard.document/hello" });
  });

  it("uses a custom param name when provided", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    mockResolveDocumentUri.mockResolvedValueOnce("at://did:plc:test/site.standard.document/hello");
    const loader = createArticleRouteLoader("did:plc:test", "slug");
    const args = { ...makeArgs(), params: { slug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchArticle).toHaveBeenCalledWith("did:plc:test", "hello", expect.any(AbortSignal));
  });

  it("throws when the slug param is missing", async () => {
    const loader = createArticleRouteLoader("did:plc:test");
    await expect(loader(makeArgs())).rejects.toThrow("Missing route param: articleSlug");
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
