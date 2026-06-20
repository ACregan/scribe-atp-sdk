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
import { fetchSite, toSlug } from "@scribe-atp/core";

const site = await fetchSite("alice.bsky.social", toSlug("alice.bsky.social"));

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

### AbortSignal

Both functions accept an optional `AbortSignal` as a third argument:

```ts
const site = await fetchSite("alice.bsky.social", "alice-bsky-social", request.signal);
```

### Utilities

```ts
import { toSlug, slugFromUri, flattenArticles } from "@scribe-atp/core";

toSlug("norobots.blog");      // → "norobots-blog"
toSlug("alice.bsky.social");  // → "alice-bsky-social"

slugFromUri("at://did:plc:abc/app.scribe.article/my-post"); // → "my-post"

flattenArticles(site.groups); // → ArticleRef[] across all groups
```

## TypeScript types

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/core";
```

| Type | Description |
| ---- | ----------- |
| `Site` | An author's full publication. |
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
