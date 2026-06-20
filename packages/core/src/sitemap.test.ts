import { describe, it, expect } from "vitest";
import { generateSitemap } from "./sitemap.js";
import type { Site } from "./types.js";

const mockSite: Site = {
  title: "Test Blog",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A test blog",
  groups: [
    {
      slug: "essays",
      title: "Essays",
      articles: [
        {
          uri: "at://did:plc:abc/app.scribe.article/first-post",
          title: "First Post",
          url: "first-post",
          splashImageUrl: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/app.scribe.article/second-post",
          title: "Second Post",
          url: "second-post",
          splashImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          // no updatedAt
        },
      ],
    },
    {
      slug: "notes",
      title: "Notes",
      articles: [
        {
          uri: "at://did:plc:abc/app.scribe.article/note-one",
          title: "Note One",
          url: "note-one",
          splashImageUrl: null,
          createdAt: "2024-03-01T00:00:00Z",
          updatedAt: "2024-03-10T00:00:00Z",
        },
      ],
    },
  ],
  ungroupedArticles: [
    {
      uri: "at://did:plc:abc/app.scribe.article/draft",
      title: "Draft",
      url: "draft",
      splashImageUrl: null,
      createdAt: "2024-05-01T00:00:00Z",
    },
  ],
};

describe("generateSitemap", () => {
  it("returns a valid XML declaration", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("includes the correct urlset xmlns", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
  });

  it("always includes the homepage URL", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain("<url><loc>https://norobots.blog</loc></url>");
  });

  it("includes the blog index URL when urlPrefix is set", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain(
      "<url><loc>https://norobots.blog/blog</loc></url>"
    );
  });

  it("does not duplicate the root URL when urlPrefix is empty", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const sitemap = generateSitemap(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    const matches = sitemap.match(/<loc>https:\/\/norobots\.blog<\/loc>/g);
    expect(matches).toHaveLength(1);
  });

  it("includes group URLs with urlPrefix", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain(
      "<url><loc>https://norobots.blog/blog/essays</loc></url>"
    );
    expect(sitemap).toContain(
      "<url><loc>https://norobots.blog/blog/notes</loc></url>"
    );
  });

  it("includes group URLs without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const sitemap = generateSitemap(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain(
      "<url><loc>https://norobots.blog/essays</loc></url>"
    );
    expect(sitemap).toContain(
      "<url><loc>https://norobots.blog/notes</loc></url>"
    );
  });

  it("includes article URLs with urlPrefix", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain(
      "https://norobots.blog/blog/essays/first-post"
    );
    expect(sitemap).toContain(
      "https://norobots.blog/blog/notes/note-one"
    );
  });

  it("includes article URLs without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const sitemap = generateSitemap(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain("https://norobots.blog/essays/first-post");
    expect(sitemap).toContain("https://norobots.blog/notes/note-one");
  });

  it("includes lastmod when updatedAt is present", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).toContain("<lastmod>2024-01-15</lastmod>");
    expect(sitemap).toContain("<lastmod>2024-03-10</lastmod>");
  });

  it("omits lastmod when updatedAt is absent", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    // second-post has no updatedAt; extract its <url>…</url> entry and check it has no lastmod
    const entryRegex =
      /<url><loc>https:\/\/norobots\.blog\/blog\/essays\/second-post<\/loc>([^<]*)<\/url>/;
    const match = sitemap.match(entryRegex);
    expect(match).not.toBeNull();
    expect(match![0]).not.toContain("<lastmod>");
  });

  it("does not include changefreq or priority tags", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).not.toContain("<changefreq>");
    expect(sitemap).not.toContain("<priority>");
  });

  it("does not include ungroupedArticles", () => {
    const sitemap = generateSitemap(mockSite, {
      baseUrl: "https://norobots.blog",
    });
    expect(sitemap).not.toContain("draft");
  });
});
