import { describe, it, expect } from "vitest";
import { generateFeed } from "./feed.js";
import type { Site } from "./types.js";

const mockSite: Site = {
  title: "Test Blog",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A test blog about things",
  groups: [
    {
      slug: "essays",
      title: "Essays",
      articles: [
        {
          uri: "at://did:plc:abc/app.scribe.article/first-post",
          title: "First Post",
          url: "first-post",
          splashImageUrl: "https://norobots.blog/splash.jpg",
          synopsis: "This is the first post synopsis",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/app.scribe.article/second-post",
          title: "Second Post",
          url: "second-post",
          splashImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          updatedAt: "2024-02-02T00:00:00Z",
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
          synopsis: "A short note",
          createdAt: "2024-03-01T00:00:00Z",
          updatedAt: "2024-03-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/app.scribe.article/note-two",
          title: "Note Two",
          url: "note-two",
          splashImageUrl: null,
          createdAt: "2024-04-01T00:00:00Z",
        },
      ],
    },
  ],
  ungroupedArticles: [
    {
      uri: "at://did:plc:abc/app.scribe.article/draft",
      title: "Draft Article",
      url: "draft",
      splashImageUrl: null,
      createdAt: "2024-05-01T00:00:00Z",
    },
  ],
};

describe("generateFeed", () => {
  it("returns a string with a valid XML preamble", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("includes correct channel title", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[Test Blog]]>");
  });

  it("uses site description when present", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[A test blog about things]]>");
  });

  it("falls back to site title when description is absent", () => {
    const siteNoDesc: Site = { ...mockSite, description: undefined };
    const feed = generateFeed(siteNoDesc, { baseUrl: "https://norobots.blog" });
    // title appears in channel <title> and <description>
    const cdataOccurrences = feed.match(/<!\[CDATA\[Test Blog\]\]>/g);
    expect(cdataOccurrences).not.toBeNull();
    expect(cdataOccurrences!.length).toBeGreaterThanOrEqual(2);
  });

  it("includes correct channel link with urlPrefix", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<link>https://norobots.blog/blog</link>");
  });

  it("includes correct channel link without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const feed = generateFeed(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(feed).toContain("<link>https://norobots.blog</link>");
  });

  it("includes all 4 articles from groups", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    const itemCount = (feed.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(4);
  });

  it("constructs correct article URLs with urlPrefix", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("https://norobots.blog/blog/essays/first-post");
    expect(feed).toContain("https://norobots.blog/blog/notes/note-one");
  });

  it("constructs correct article URLs without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const feed = generateFeed(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(feed).toContain("https://norobots.blog/essays/first-post");
    expect(feed).toContain("https://norobots.blog/notes/note-two");
  });

  it("caps items when limit option is provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      limit: 2,
    });
    const itemCount = (feed.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(2);
  });

  it("includes atom:link when feedUrl is provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      feedUrl: "https://norobots.blog/feed.xml",
    });
    expect(feed).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(feed).toContain(
      '<atom:link href="https://norobots.blog/feed.xml" rel="self" type="application/rss+xml"/>'
    );
  });

  it("does not include atom namespace when feedUrl is absent", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).not.toContain("xmlns:atom");
    expect(feed).not.toContain("atom:link");
  });

  it("does not include ungroupedArticles", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).not.toContain("draft");
    expect(feed).not.toContain("Draft Article");
  });

  it("uses empty string for synopsis when absent", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    // second-post has no synopsis
    expect(feed).toContain("<description><![CDATA[]]></description>");
  });

  it("uses the language option when provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      language: "fr",
    });
    expect(feed).toContain("<language>fr</language>");
  });

  it("defaults language to 'en'", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<language>en</language>");
  });
});
