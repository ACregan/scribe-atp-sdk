import { describe, it, expect, vi } from "vitest";
import { createSiteLoader, createArticleLoader } from "./loaders.js";

vi.mock("@scribe-atp/core", () => ({
  fetchSite: vi.fn(),
  fetchArticle: vi.fn(),
}));

import { fetchSite, fetchArticle } from "@scribe-atp/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticle = vi.mocked(fetchArticle);

const makeRequest = () => new Request("https://example.com");

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
  url: "hello",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("createSiteLoader", () => {
  it("returns a loader that fetches the site", async () => {
    mockFetchSite.mockResolvedValueOnce(site);
    const loader = createSiteLoader("did:plc:test", "example-com");
    const result = await loader({ request: makeRequest(), params: {}, context: {} });
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
    const request = makeRequest();
    await loader({ request, params: {}, context: {} });
    expect(mockFetchSite).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      request.signal
    );
  });
});

describe("createArticleLoader", () => {
  it("returns a loader that fetches the article", async () => {
    mockFetchArticle.mockResolvedValueOnce(article);
    const loader = createArticleLoader("did:plc:test", "hello");
    const result = await loader({ request: makeRequest(), params: {}, context: {} });
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
    const request = makeRequest();
    await loader({ request, params: {}, context: {} });
    expect(mockFetchArticle).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      request.signal
    );
  });
});
