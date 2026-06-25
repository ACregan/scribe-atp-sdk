# @scribe-atp/core

[![npm](https://img.shields.io/npm/v/@scribe-atp/core)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Framework-agnostic TypeScript functions for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. No runtime dependencies.

This is the foundation of the Scribe ATP SDK — all framework adapters (`@scribe-atp/react`, `@scribe-atp/angular`, etc.) build on top of it.

## Installation

```bash
npm install @scribe-atp/core
```

## Usage

### Fetch a site

A *site* is an author's publication — it contains their article groups, metadata, and splash image.

```ts
import { fetchSite } from "@scribe-atp/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

console.log(site.title);
console.log(site.groups);            // published article groups
console.log(site.ungroupedArticles); // unpublished / draft articles
console.log(site.urlPrefix);         // path prefix, e.g. "blog" — may be empty
```

### Fetch an article

```ts
import { fetchArticle } from "@scribe-atp/core";

const article = await fetchArticle("alice.bsky.social", "my-first-post");

console.log(article.title);
console.log(article.content);   // full HTML string
console.log(article.synopsis);  // short summary for cards and meta tags
```

### List all sites

When you need to discover every site an author has published — for example, to build a browser or reader interface — use `listSites`:

```ts
import { listSites, slugFromUri } from "@scribe-atp/core";

const sites = await listSites("alice.bsky.social");

for (const site of sites) {
  const siteRkey = slugFromUri(site.uri); // the record key (a TID), e.g. "3mp4nd46xwr2h"
  console.log(site.title, site.groups);
}
```

### List all articles

`listArticles` returns lightweight `ArticleRef` objects for every article in the author's repository, regardless of publication state:

```ts
import { listSites, listArticles } from "@scribe-atp/core";

const [sites, articles] = await Promise.all([
  listSites("alice.bsky.social"),
  listArticles("alice.bsky.social"),
]);

// derive which articles are drafts (not referenced in any site record)
const referencedUris = new Set(
  sites.flatMap((s) => [
    ...s.groups.flatMap((g) => g.articles),
    ...s.ungroupedArticles,
  ]).map((a) => a.uri)
);

const drafts = articles.filter((a) => !referencedUris.has(a.uri));
```

Both functions handle cursor-based pagination automatically and accept an optional `AbortSignal`.

### AbortSignal

All fetch functions accept an optional `AbortSignal` as their final argument:

```ts
const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social", request.signal);
```

### Utilities

```ts
import { slugFromUri, flattenArticles } from "@scribe-atp/core";

slugFromUri("at://did:plc:abc/app.scribe.article/my-post"); // → "my-post"

flattenArticles(site.groups); // → ArticleRef[] across all groups
```

### Feed & Sitemap

Generate an RSS 2.0 feed or an XML sitemap from a fetched `Site` object. Both functions are pure — they produce a string and make no network requests.

#### RSS feed

```ts
import { fetchSite, generateFeed } from "@scribe-atp/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

const xml = generateFeed(site, {
  baseUrl: "https://alice.bsky.social",
  feedUrl: "https://alice.bsky.social/feed.xml", // adds <atom:link rel="self">
  language: "en",  // defaults to "en"
  limit: 20,       // cap items; omit to include all
});

// In a server handler:
return new Response(xml, {
  headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
});
```

Only published articles (from `site.groups`) are included. Draft articles in `site.ungroupedArticles` are excluded.

#### Sitemap entries

`getSitemapEntries` returns structured data — not XML — so you can merge Scribe URLs into your own framework's sitemap generator alongside non-Scribe pages (portfolio, contact, etc.).

```ts
import { fetchSite, getSitemapEntries } from "@scribe-atp/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

const entries = getSitemapEntries(site, {
  baseUrl: "https://alice.bsky.social",
});
// [
//   { url: "https://alice.bsky.social" },
//   { url: "https://alice.bsky.social/blog" },
//   { url: "https://alice.bsky.social/blog/essays/first-post", lastmod: "2024-01-15" },
//   ...
// ]
```

Each entry is `{ url: string, lastmod?: string }`. Merge with your own routes and pass to your framework's sitemap generator. Article entries include `lastmod` when `updatedAt` is available. Draft articles in `site.ungroupedArticles` are excluded.

## TypeScript types

```ts
import type { Site, SiteRecord, Article, ArticleRef, SiteGroup } from "@scribe-atp/core";
```

| Type | Description |
| ---- | ----------- |
| `Site` | An author's full publication. |
| `SiteRecord` | A `Site` with a `uri` field — the AT URI of the record. Returned by `listSites`. |
| `Article` | A single article with full HTML content. |
| `SiteGroup` | A named group of articles within a site. |
| `ArticleRef` | Lightweight article snapshot for rendering lists without N+1 fetches. |

## How it works

Scribe content is stored on the AT Protocol. Each author's articles live on their own Personal Data Server (PDS), which may be hosted anywhere. This package resolves the correct PDS for each author automatically — handling both `did:plc` and `did:web` identities — and caches DID document lookups in memory for the lifetime of the module.

## Framework adapters

| Package | Framework |
| ------- | --------- |
| [`@scribe-atp/react`](https://www.npmjs.com/package/@scribe-atp/react) | React 18+ hooks |
| [`@scribe-atp/react-router-framework`](https://www.npmjs.com/package/@scribe-atp/react-router-framework) | React Router v7 framework mode |
| [`@scribe-atp/angular`](https://www.npmjs.com/package/@scribe-atp/angular) | Angular 16+ |

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
