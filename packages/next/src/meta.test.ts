import { describe, it, expect, vi } from "vitest";
import { articleMetadata, siteMetadata } from "./meta.js";

vi.mock("@scribe-atp/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@scribe-atp/core")>();
  return { ...actual };
});

import type { Article, Site } from "@scribe-atp/core";

const site: Site = {
  uri: "at://did:plc:abc/site.standard.publication/tid123",
  title: "NoRobots",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A blog about engineering.",
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

describe("articleMetadata", () => {
  it("returns combined title", () => {
    const meta = articleMetadata(article, site);
    expect(meta.title).toBe("LLMs Are Full of Shit — NoRobots");
  });

  it("sets og:type to article", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph?.type).toBe("article");
  });

  it("composes og:url from article.site + urlPrefix + path", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph?.url).toBe(
      "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    );
  });

  it("prefers article.canonicalUrl when present", () => {
    const meta = articleMetadata(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(meta.openGraph?.url).toBe("https://norobots.blog/custom");
  });

  it("includes og:image when splashImageUrl present", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/llms.webp",
    );
    expect(meta.twitter?.card).toBe("summary_large_image");
  });

  it("falls back to summary card when no splashImageUrl", () => {
    const meta = articleMetadata({ ...article, splashImageUrl: undefined }, site);
    expect(meta.twitter?.card).toBe("summary");
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("omits description when absent", () => {
    const meta = articleMetadata({ ...article, description: undefined }, site);
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.description).toBeUndefined();
  });
});

describe("siteMetadata", () => {
  it("returns site title", () => {
    const meta = siteMetadata(site);
    expect(meta.title).toBe("NoRobots");
  });

  it("sets og:type to website", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph?.type).toBe("website");
  });

  it("composes og:url from url + urlPrefix", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph?.url).toBe("https://norobots.blog/blog");
  });

  it("handles missing urlPrefix", () => {
    const meta = siteMetadata({ ...site, urlPrefix: "" });
    expect(meta.openGraph?.url).toBe("https://norobots.blog");
  });

  it("includes og:image when splashImageUrl present", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/splash.webp",
    );
  });
});
