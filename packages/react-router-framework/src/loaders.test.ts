import { describe, it, expect, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { createSiteLoader, createArticleLoader } from "./loaders.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
  fetchArticle: vi.fn(),
}));

import { fetchSite, fetchArticle } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticle = vi.mocked(fetchArticle);

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
