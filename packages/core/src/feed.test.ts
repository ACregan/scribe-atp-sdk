import { describe, it, expect } from "vitest";
import { generateFeed } from "./feed.js";
import type { Site } from "./types.js";

const mockSite: Site = {
  uri: "at://did:plc:abc/site.standard.publication/norobotspubkey",
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
          uri: "at://did:plc:abc/site.standard.document/first-post",
          title: "First Post",
          slug: "first-post",
          splashImageUrl: "https://norobots.blog/splash.jpg",
          description: "This is the first post synopsis",
          createdAt: "2024-01-01T00:00:00Z",
          publishedAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/second-post",
          title: "Second Post",
          slug: "second-post",
          splashImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          publishedAt: "2024-02-01T12:00:00Z",
          updatedAt: "2024-02-02T00:00:00Z",
        },
      ],
    },
    {
      slug: "notes",
      title: "Notes",
      articles: [
        {
          uri: "at://did:plc:abc/site.standard.document/note-one",
          title: "Note One",
          slug: "note-one",
          splashImageUrl: null,
          description: "A short note",
          createdAt: "2024-03-01T00:00:00Z",
          publishedAt: "2024-03-01T12:00:00Z",
          updatedAt: "2024-03-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/note-two",
          title: "Note Two",
          slug: "note-two",
          splashImageUrl: null,
          createdAt: "2024-04-01T00:00:00Z",
          publishedAt: "2024-04-01T12:00:00Z",
        },
      ],
    },
  ],
  ungroupedArticles: [
    {
      uri: "at://did:plc:abc/site.standard.document/draft",
      title: "Draft Article",
      slug: "draft",
      splashImageUrl: null,
      createdAt: "2024-05-01T00:00:00Z",
      publishedAt: "2024-05-01T12:00:00Z",
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

  it("uses empty string for description when absent", () => {
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

describe("generateFeed XML escaping", () => {
  it("escapes XML-significant characters in the atom:link feedUrl", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      feedUrl: "https://norobots.blog/feed.xml?tag=news&category=\"top\"",
    });
    expect(feed).toContain(
      '<atom:link href="https://norobots.blog/feed.xml?tag=news&amp;category=&quot;top&quot;" rel="self" type="application/rss+xml"/>',
    );
    expect(feed).not.toContain('category="top"');
  });

  it("escapes XML-significant characters in the language option", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      language: "en & <fr>",
    });
    expect(feed).toContain("<language>en &amp; &lt;fr&gt;</language>");
  });

  it("wraps titles containing markup in CDATA rather than escaping them", () => {
    const site: Site = { ...mockSite, title: `A "quoted" <Title> & More` };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain(`<![CDATA[A "quoted" <Title> & More]]>`);
  });

  it("wraps article descriptions containing markup in CDATA rather than escaping them", () => {
    const site: Site = {
      ...mockSite,
      groups: [
        {
          slug: "essays",
          title: "Essays",
          articles: [
            {
              ...mockSite.groups[0].articles[0],
              description: `Uses <b>bold</b> & "quotes"`,
            },
          ],
        },
      ],
    };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain(`<description><![CDATA[Uses <b>bold</b> & "quotes"]]></description>`);
  });

  // Not fixed as part of this test-coverage pass — flagging as a discovered
  // latent bug. XML's CDATA sections cannot contain the literal sequence
  // "]]>": if it appears verbatim, it closes the CDATA section early,
  // producing a malformed feed. An article title/description containing
  // that exact sequence (unlikely, but not impossible from pasted content)
  // would corrupt the generated XML. cdata() has no handling for it.
  it("[known gap] does not escape a literal ']]>' inside CDATA content, which would truncate the CDATA section", () => {
    const site: Site = { ...mockSite, title: "Weird title ]]> more text" };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[Weird title ]]> more text]]>");
  });
});
