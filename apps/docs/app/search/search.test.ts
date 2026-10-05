import { describe, it, expect } from "vitest";
import { buildSearchIndex, type SourcePage } from "./buildIndex";
import { searchEntries } from "./search";

const pages: SourcePage[] = [
  {
    slug: "api/core",
    title: "@skyscribe-sdk/core",
    description: "Full API: functions, types, and errors.",
    section: "API reference",
    source: [
      "# @skyscribe-sdk/core",
      "",
      "## Functions",
      "",
      "### `fetchSite`",
      "",
      "Fetches a Site. See `NotFoundError`.",
      "",
      "### `withRetry`",
      "",
      "<Callout>Retries `fetchSite` calls.</Callout>",
    ].join("\n"),
  },
  {
    slug: "guides/cancellation",
    title: "Request cancellation",
    description: "Passing AbortSignals through fetchSite and fetchArticle.",
    section: "Guides",
    source: "# Request cancellation\n\n## Handling AbortError\n\nUse `AbortController`.",
  },
  {
    slug: "guides/rss",
    title: "RSS feeds",
    description: "Generating an RSS 2.0 feed.",
    section: "Guides",
    source: null,
  },
];

describe("buildSearchIndex", () => {
  const index = buildSearchIndex(pages);

  it("adds one entry per page, with its section as context", () => {
    const page = index.find((e) => e.kind === "page" && e.href === "/guides/rss");
    expect(page).toMatchObject({ title: "RSS feeds", context: "Guides" });
  });

  it("adds h2/h3 headings with anchors matching rehype-slug, but not the h1", () => {
    const headings = index.filter((e) => e.kind === "heading" && e.context === "@skyscribe-sdk/core");
    expect(headings.map((h) => [h.title, h.href])).toEqual([
      ["Functions", "/api/core#functions"],
      ["fetchSite", "/api/core#fetchsite"],
      ["withRetry", "/api/core#withretry"],
    ]);
  });

  it("collects API names from inline code (including inside JSX) as page keywords", () => {
    const page = index.find((e) => e.kind === "page" && e.href === "/api/core");
    expect(page?.keywords).toContain("NotFoundError");
    expect(page?.keywords).toContain("fetchSite");
  });
});

describe("searchEntries", () => {
  const index = buildSearchIndex(pages);

  it("needs at least two characters", () => {
    expect(searchEntries(index, "w")).toEqual([]);
  });

  it("finds an API heading by name, ahead of pages that merely mention it", () => {
    const results = searchEntries(index, "fetchsite");
    expect(results[0]).toMatchObject({ title: "fetchSite", href: "/api/core#fetchsite" });
    expect(results.some((r) => r.href === "/guides/cancellation")).toBe(true);
  });

  it("matches multi-word queries against titles", () => {
    expect(searchEntries(index, "request canc")[0]).toMatchObject({
      href: "/guides/cancellation",
    });
  });

  it("finds a page by an API name used on it", () => {
    expect(searchEntries(index, "AbortController")[0].href).toBe("/guides/cancellation");
  });

  it("returns nothing when a term matches nothing", () => {
    expect(searchEntries(index, "fetchSite zzzz")).toEqual([]);
  });
});
