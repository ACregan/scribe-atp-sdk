import { describe, it, expect } from "vitest";
import { generateArticleMeta, generateSiteMeta } from "./meta.js";
import type { Article, Site } from "./types.js";

const site: Site = {
  uri: "at://did:plc:abc/site.standard.publication/tid123",
  title: "NoRobots",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A blog about engineering and design.",
  splashImageUrl: "https://norobots.blog/images/splash.webp",
  logoImageUrl: "https://norobots.blog/images/logo.webp",
  groups: [],
  ungroupedArticles: [],
};

const article: Article = {
  title: "LLMs Are Full of Shit",
  content: "<p>Content</p>",
  path: "/engineering/llms-are-full-of-shit",
  site: "https://norobots.blog",
  splashImageUrl: "https://norobots.blog/images/llms.webp",
  description: "A post about LLMs.",
  createdAt: "2025-01-01T00:00:00.000Z",
  publishedAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("generateArticleMeta", () => {
  it("includes title tag combining article and site titles", () => {
    const tags = generateArticleMeta(article, site);
    expect(tags).toContainEqual({ title: "LLMs Are Full of Shit — NoRobots" });
  });

  it("composes canonical url from article.site + site.urlPrefix + article.path", () => {
    const tags = generateArticleMeta(article, site);
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });

  it("prefers article.canonicalUrl when present", () => {
    const tags = generateArticleMeta(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/custom",
    });
  });

  it("handles missing urlPrefix", () => {
    const tags = generateArticleMeta(article, { ...site, urlPrefix: "" });
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/engineering/llms-are-full-of-shit",
    });
  });

  it("includes og:image and twitter:image when splashImageUrl present", () => {
    const tags = generateArticleMeta(article, site);
    expect(tags).toContainEqual({
      property: "og:image",
      content: "https://norobots.blog/images/llms.webp",
    });
    expect(tags).toContainEqual({
      name: "twitter:image",
      content: "https://norobots.blog/images/llms.webp",
    });
    expect(tags).toContainEqual({
      name: "twitter:card",
      content: "summary_large_image",
    });
  });

  it("falls back to summary card when no splashImageUrl", () => {
    const tags = generateArticleMeta(
      { ...article, splashImageUrl: undefined },
      site,
    );
    expect(tags).toContainEqual({ name: "twitter:card", content: "summary" });
    expect(tags).not.toContainEqual(
      expect.objectContaining({ property: "og:image" }),
    );
  });

  it("omits description tags when description is absent", () => {
    const tags = generateArticleMeta(
      { ...article, description: undefined },
      site,
    );
    expect(tags).not.toContainEqual(
      expect.objectContaining({ name: "description" }),
    );
  });

  it("sets og:type to article", () => {
    const tags = generateArticleMeta(article, site);
    expect(tags).toContainEqual({ property: "og:type", content: "article" });
  });
});

describe("generateSiteMeta", () => {
  it("includes site title as title tag", () => {
    const tags = generateSiteMeta(site);
    expect(tags).toContainEqual({ title: "NoRobots" });
  });

  it("composes site url from url + urlPrefix", () => {
    const tags = generateSiteMeta(site);
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog",
    });
  });

  it("handles missing urlPrefix", () => {
    const tags = generateSiteMeta({ ...site, urlPrefix: "" });
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog",
    });
  });

  it("sets og:type to website", () => {
    const tags = generateSiteMeta(site);
    expect(tags).toContainEqual({ property: "og:type", content: "website" });
  });

  it("includes og:image when splashImageUrl present", () => {
    const tags = generateSiteMeta(site);
    expect(tags).toContainEqual({
      property: "og:image",
      content: "https://norobots.blog/images/splash.webp",
    });
  });
});
