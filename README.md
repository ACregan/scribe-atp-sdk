# SkyScribe SDK

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/core?label=%40skyscribe-sdk%2Fcore)](https://www.npmjs.com/package/@skyscribe-sdk/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

A TypeScript SDK for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Authors write and publish articles in SkyScribe; this SDK is for developers who want to display that content in their own sites and apps.

It handles the parts that are easy to get wrong: resolving author identities to the correct Personal Data Server (PDS), caching DID document lookups, normalising records, and wiring up request cancellation — so you can focus on building your UI.

---

## Which package do I need?

| Package | Install | Use when… |
| ------- | ------- | --------- |
| `@skyscribe-sdk/core` | `npm install @skyscribe-sdk/core` | Any framework, or no framework. Start here. |
| `@skyscribe-sdk/react` | `npm install @skyscribe-sdk/react` | React SPA / client-rendered components. |
| `@skyscribe-sdk/react-router-framework` | `npm install @skyscribe-sdk/react-router-framework` | React Router v7 framework (server) mode. |
| `@skyscribe-sdk/angular` | `npm install @skyscribe-sdk/angular` | Angular 16+. |
| `@skyscribe-sdk/next` | `npm install @skyscribe-sdk/next` | Next.js 13+ App Router. |
| `@skyscribe-sdk/vue` | `npm install @skyscribe-sdk/vue` | Vue 3+ SPA / client-rendered components. |
| `@skyscribe-sdk/nuxt` | `npm install @skyscribe-sdk/nuxt` | Nuxt 3+. |

For **SvelteKit**, **Astro**, or any other meta-framework with server-side data fetching, install `@skyscribe-sdk/core` and call `fetchSite` / `fetchArticle` directly in your page loaders or server components. See the [Other frameworks](#other-frameworks) section.

---

## Requirements

- **Node.js** 22 or later
- **TypeScript** 5.0 or later (optional but recommended — the packages ship full type declarations)

---

## `@skyscribe-sdk/core`

Framework-agnostic. Pure async functions with no runtime dependencies.

```bash
npm install @skyscribe-sdk/core
```

### Fetch a site

A *site* is an author's publication — it contains their article groups, metadata, and splash image. You identify it by the author's handle (or DID) and the site's canonical HTTPS URL.

```ts
import { fetchSite } from "@skyscribe-sdk/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

console.log(site.title);
console.log(site.groups);           // published article groups
console.log(site.ungroupedArticles); // unpublished / draft articles
```

If the author's site lives under a URL prefix (e.g. `anthonycregan.co.uk/blog`), the `urlPrefix` field tells you the path segment to prepend when building URLs:

```ts
const basePath = site.urlPrefix ? `/${site.urlPrefix}` : "";
// e.g. "/blog" or ""
```

### Fetch an article

```ts
import { fetchArticleBySlug } from "@skyscribe-sdk/core";

const { article } = await fetchArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");

console.log(article.title);
console.log(article.content);     // full HTML: sanitise it if you render accounts you don't control
console.log(article.description); // short summary for cards and meta tags
```

### List all sites and articles

When you need to discover everything an author has published — for example, to build a content browser — use `listSites` and `listArticles`:

```ts
import { listSites, listArticles, slugFromUri } from "@skyscribe-sdk/core";

const [sites, articles] = await Promise.all([
  listSites("alice.bsky.social"),
  listArticles("alice.bsky.social"),
]);

// Each SiteRecord includes a `uri` field alongside the usual Site fields
for (const site of sites) {
  const siteRkey = slugFromUri(site.uri); // e.g. "https://alice.bsky.social"
  console.log(site.title, siteRkey);
}

// Derive draft articles — those not referenced in any site record
const referencedUris = new Set(
  sites.flatMap((s) => [
    ...s.groups.flatMap((g) => g.articles),
    ...s.ungroupedArticles,
  ]).map((a) => a.uri)
);
const drafts = articles.filter((a) => !referencedUris.has(a.uri));
```

Both functions handle cursor-based pagination automatically.

### AbortSignal

All fetch functions accept an optional `AbortSignal` as their final argument. Pass `request.signal` in server contexts to cancel the fetch if the user navigates away:

```ts
const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social", request.signal);
const sites = await listSites("alice.bsky.social", request.signal);
```

### Utilities

```ts
import { slugFromUri, flattenArticles } from "@skyscribe-sdk/core";

slugFromUri("at://did:plc:abc/site.standard.document/3mp4hfovqib2h"); // → "3mp4hfovqib2h"

flattenArticles(site.groups); // → ArticleRef[] — all articles across all groups
```

---

## `@skyscribe-sdk/react`

React hooks wrapping `@skyscribe-sdk/core`. Handles loading state, error state, and request cancellation automatically. Requires React 18 or later.

```bash
npm install @skyscribe-sdk/react
```

### `useSite`

```tsx
import { useSite } from "@skyscribe-sdk/react";

function BlogIndex() {
  const { site, loading, error } = useSite("alice.bsky.social", "https://alice.bsky.social");

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  return (
    <ul>
      {site.groups.map((group) =>
        group.articles.map((article) => (
          <li key={article.uri}>{article.title}</li>
        ))
      )}
    </ul>
  );
}
```

### `useArticleBySlug`

Looks the article up by its slug (as in its URL) and returns it with its AT URI:

```tsx
import { useArticleBySlug } from "@skyscribe-sdk/react";

function ArticlePage({ slug }: { slug: string }) {
  const { article, uri, loading, error } = useArticleBySlug(
    "alice.bsky.social",
    "https://alice.bsky.social",
    slug
  );

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

Both hooks re-fetch automatically when their parameters change and abort the in-flight request when the component unmounts.

---

## `@skyscribe-sdk/react-router-framework`

Loader factories for [React Router v7 framework mode](https://reactrouter.com). Not compatible with React Router SPA (library) mode — use `@skyscribe-sdk/react` instead.

```bash
npm install @skyscribe-sdk/react-router-framework
```

### Site index route

```ts
// app/routes/blog.tsx
import { createSiteLoader } from "@skyscribe-sdk/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createSiteLoader("alice.bsky.social", "https://alice.bsky.social");

export default function Blog() {
  const site = useLoaderData<typeof loader>();

  return (
    <ul>
      {site.groups.map((group) =>
        group.articles.map((article) => (
          <li key={article.uri}>{article.title}</li>
        ))
      )}
    </ul>
  );
}
```

### Dynamic article route

For routes where the slug comes from URL params, use `fetchArticleBySlug` from `@skyscribe-sdk/core` inside your loader (or `createArticleRouteLoader` from `@skyscribe-sdk/react-router-framework`):

```ts
// app/routes/blog.$slug.tsx
import type { LoaderFunctionArgs } from "react-router";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import { useLoaderData } from "react-router";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { article } = await fetchArticleBySlug("alice.bsky.social", "https://alice.bsky.social", params.slug!, request.signal);
  return article;
};

export default function Article() {
  const article = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

---

## `@skyscribe-sdk/angular`

Angular service and injection functions. Requires Angular 16 or later. Ships two APIs — choose based on your component style.

```bash
npm install @skyscribe-sdk/angular
```

### Observable API — `ScribeService`

`ScribeService` is provided in the root injector and returns cold Observables. The underlying fetch is cancelled automatically when you unsubscribe.

Compose with the `async` pipe for the most concise result:

```ts
import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf, NgFor } from "@angular/common";
import { ScribeService } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor],
  template: `
    <ng-container *ngIf="site$ | async as site">
      <h1>{{ site.title }}</h1>
      <ul>
        <li *ngFor="let group of site.groups">{{ group.title }}</li>
      </ul>
    </ng-container>
  `,
})
export class BlogComponent {
  site$ = inject(ScribeService).getSite("alice.bsky.social", "https://alice.bsky.social");
}
```

`getArticleBySlug` follows the same pattern, emitting `{ article, uri }`:

```ts
result$ = inject(ScribeService).getArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
```

For explicit subscription management:

```ts
export class BlogComponent implements OnInit, OnDestroy {
  site: Site | null = null;
  loading = true;
  error: Error | null = null;

  private sub: Subscription | undefined;

  constructor(private scribe: ScribeService) {}

  ngOnInit() {
    this.sub = this.scribe.getSite("alice.bsky.social", "https://alice.bsky.social").subscribe({
      next:  (site) => { this.site = site; this.loading = false; },
      error: (err)  => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

### Signals API — `injectSite` / `injectArticleBySlug`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component is destroyed.

```ts
import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { injectArticleBySlug } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [NgIf],
  template: `
    <p *ngIf="vm.loading()">Loading…</p>
    <p *ngIf="vm.error()">{{ vm.error()!.message }}</p>
    <article *ngIf="vm.article() as article">
      <h1>{{ article.title }}</h1>
      <div [innerHTML]="article.content"></div>
    </article>
  `,
})
export class ArticleComponent {
  vm = injectArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
}
```

`injectSite` follows the same pattern, returning `{ site, loading, error }` as signals.

> **Note:** Injection functions must be called in an injection context — inside a constructor or class field initialiser. They cannot be called inside lifecycle hooks or event handlers.

---

## Other frameworks

For **Next.js**, **Nuxt**, **SvelteKit**, **Astro**, or any framework with server-side data fetching, install `@skyscribe-sdk/core` and call `fetchSite` / `fetchArticle` directly. They're plain async functions that work anywhere JavaScript runs.

**Next.js App Router:**

```ts
// app/blog/page.tsx
import { fetchSite } from "@skyscribe-sdk/core";

export default async function BlogPage() {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

  return (
    <ul>
      {site.groups.flatMap((group) =>
        group.articles.map((article) => (
          <li key={article.uri}>{article.title}</li>
        ))
      )}
    </ul>
  );
}
```

**SvelteKit:**

```ts
// src/routes/blog/+page.server.ts
import { fetchSite } from "@skyscribe-sdk/core";

export const load = async ({ fetch: _ }) => {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");
  return { site };
};
```

---

## TypeScript types

All types are exported from every package so you only ever need one import:

```ts
import type { Site, SiteRecord, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/core";
// or from "@skyscribe-sdk/react", "@skyscribe-sdk/angular", etc.
```

| Type | Description |
| ---- | ----------- |
| `Site` | An author's full publication. Contains `title`, `url`, `urlPrefix`, `groups`, and `ungroupedArticles`. |
| `SiteRecord` | A `Site` with a `uri` field — the full AT URI of the record. Returned by `listSites`. |
| `Article` | A single article. Contains `title`, `content` (HTML), `path`, `canonicalUrl`, `description`, `coverImageUrl`, `tags`, `contributors`, `bskyPostRef` and its dates. |
| `SiteGroup` | A named group of articles within a site. Contains `slug`, `title`, and `articles` (`ArticleRef[]`). |
| `ArticleRef` | A lightweight article snapshot cached inside the site record. Contains enough metadata to render article cards without fetching each article individually. |

---

## How it works

Scribe stores content on the AT Protocol — the same open network that powers Bluesky. Each author's articles live on their own Personal Data Server (PDS), which may be hosted anywhere.

The SDK resolves the correct PDS for each author automatically:

1. If you pass a handle (`alice.bsky.social`), it resolves it to a stable DID
2. It fetches the author's DID document to discover their PDS endpoint
3. It fetches the site or article record directly from that PDS

PDS lookups are cached in memory for the lifetime of the module, so repeated calls within a single page load only hit the network once per author.

Resolved publication (site) AT URIs are cached separately for 60 seconds. If a cached URI stops resolving — e.g. the site record was deleted and recreated — `fetchSite` automatically falls back to a fresh lookup instead of failing, so a long-running server process self-heals without needing a restart.

---

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE) — © 2025 Anthony Cregan
