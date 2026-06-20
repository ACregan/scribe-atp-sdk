# @scribe-atp/sdk

[![npm](https://img.shields.io/npm/v/@scribe-atp/core?label=%40scribe-atp%2Fcore)](https://www.npmjs.com/package/@scribe-atp/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

A TypeScript SDK for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Authors write and publish articles in Scribe CMS; this SDK is for developers who want to display that content in their own sites and apps.

It handles the parts that are easy to get wrong: resolving author identities to the correct Personal Data Server (PDS), caching DID document lookups, normalising records, and wiring up request cancellation — so you can focus on building your UI.

---

## Which package do I need?

| Package | Install | Use when… |
| ------- | ------- | --------- |
| `@scribe-atp/core` | `npm install @scribe-atp/core` | Any framework, or no framework. Start here. |
| `@scribe-atp/react` | `npm install @scribe-atp/react` | React SPA / client-rendered components. |
| `@scribe-atp/react-router-framework` | `npm install @scribe-atp/react-router-framework` | React Router v7 framework (server) mode. |
| `@scribe-atp/angular` | `npm install @scribe-atp/angular` | Angular 16+. |
| `@scribe-atp/vue` | `npm install @scribe-atp/vue` | Vue 3+ SPA / client-rendered components. |
| `@scribe-atp/nuxt` | `npm install @scribe-atp/nuxt` | Nuxt 3+. |

For **SvelteKit**, **Astro**, or any other meta-framework with server-side data fetching, install `@scribe-atp/core` and call `fetchSite` / `fetchArticle` directly in your page loaders or server components. See the [Other frameworks](#other-frameworks) section.

---

## Requirements

- **Node.js** 22 or later
- **TypeScript** 5.0 or later (optional but recommended — the packages ship full type declarations)

---

## `@scribe-atp/core`

Framework-agnostic. Pure async functions with no runtime dependencies.

```bash
npm install @scribe-atp/core
```

### Fetch a site

A *site* is an author's publication — it contains their article groups, metadata, and splash image. You identify it by the author's handle (or DID) and their site slug.

```ts
import { fetchSite, toSlug } from "@scribe-atp/core";

// toSlug derives the site slug from the author's domain
const site = await fetchSite("alice.bsky.social", toSlug("alice.bsky.social"));

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
import { fetchArticle } from "@scribe-atp/core";

const article = await fetchArticle("alice.bsky.social", "my-first-post");

console.log(article.title);
console.log(article.content);   // full HTML string — safe to render directly
console.log(article.synopsis);  // short summary for cards and meta tags
```

### AbortSignal

Both functions accept an optional `AbortSignal` as a third argument. Pass `request.signal` in server contexts to cancel the fetch if the user navigates away:

```ts
const site = await fetchSite("alice.bsky.social", "alice-bsky-social", request.signal);
```

### Utilities

```ts
import { toSlug, slugFromUri, flattenArticles } from "@scribe-atp/core";

toSlug("norobots.blog");      // → "norobots-blog"
toSlug("alice.bsky.social");  // → "alice-bsky-social"

slugFromUri("at://did:plc:abc/app.scribe.article/my-post"); // → "my-post"

flattenArticles(site.groups); // → ArticleRef[] — all articles across all groups
```

---

## `@scribe-atp/react`

React hooks wrapping `@scribe-atp/core`. Handles loading state, error state, and request cancellation automatically. Requires React 18 or later.

```bash
npm install @scribe-atp/react
```

### `useSite`

```tsx
import { useSite, toSlug } from "@scribe-atp/react";

function BlogIndex() {
  const { site, loading, error } = useSite("alice.bsky.social", toSlug("alice.bsky.social"));

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

### `useArticle`

```tsx
import { useArticle } from "@scribe-atp/react";

function ArticlePage({ author, slug }: { author: string; slug: string }) {
  const { article, loading, error } = useArticle(author, slug);

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

## `@scribe-atp/react-router-framework`

Loader factories for [React Router v7 framework mode](https://reactrouter.com). Not compatible with React Router SPA (library) mode — use `@scribe-atp/react` instead.

```bash
npm install @scribe-atp/react-router-framework
```

### Site index route

```ts
// app/routes/blog.tsx
import { createSiteLoader } from "@scribe-atp/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createSiteLoader("alice.bsky.social", "alice-bsky-social");

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

For routes where the slug comes from URL params, use `fetchArticle` from `@scribe-atp/core` directly inside your loader:

```ts
// app/routes/blog.$slug.tsx
import type { LoaderFunctionArgs } from "react-router";
import { fetchArticle } from "@scribe-atp/core";
import { useLoaderData } from "react-router";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  return fetchArticle("alice.bsky.social", params.slug!, request.signal);
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

## `@scribe-atp/angular`

Angular service and injection functions. Requires Angular 16 or later. Ships two APIs — choose based on your component style.

```bash
npm install @scribe-atp/angular
```

### Observable API — `ScribeService`

`ScribeService` is provided in the root injector and returns cold Observables. The underlying fetch is cancelled automatically when you unsubscribe.

Compose with the `async` pipe for the most concise result:

```ts
import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf, NgFor } from "@angular/common";
import { ScribeService } from "@scribe-atp/angular";

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
  site$ = inject(ScribeService).getSite("alice.bsky.social", "alice-bsky-social");
}
```

`getArticle` follows the same pattern:

```ts
article$ = inject(ScribeService).getArticle("alice.bsky.social", "my-first-post");
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
    this.sub = this.scribe.getSite("alice.bsky.social", "alice-bsky-social").subscribe({
      next:  (site) => { this.site = site; this.loading = false; },
      error: (err)  => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

### Signals API — `injectSite` / `injectArticle`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component is destroyed.

```ts
import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { injectArticle } from "@scribe-atp/angular";

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
  vm = injectArticle("alice.bsky.social", "my-first-post");
}
```

`injectSite` follows the same pattern, returning `{ site, loading, error }` as signals.

> **Note:** Injection functions must be called in an injection context — inside a constructor or class field initialiser. They cannot be called inside lifecycle hooks or event handlers.

---

## Other frameworks

For **Next.js**, **Nuxt**, **SvelteKit**, **Astro**, or any framework with server-side data fetching, install `@scribe-atp/core` and call `fetchSite` / `fetchArticle` directly. They're plain async functions that work anywhere JavaScript runs.

**Next.js App Router:**

```ts
// app/blog/page.tsx
import { fetchSite, toSlug } from "@scribe-atp/core";

export default async function BlogPage() {
  const site = await fetchSite("alice.bsky.social", toSlug("alice.bsky.social"));

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
import { fetchSite, toSlug } from "@scribe-atp/core";

export const load = async ({ fetch: _ }) => {
  const site = await fetchSite("alice.bsky.social", toSlug("alice.bsky.social"));
  return { site };
};
```

---

## TypeScript types

All types are exported from every package so you only ever need one import:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/core";
// or from "@scribe-atp/react", "@scribe-atp/angular", etc.
```

| Type | Description |
| ---- | ----------- |
| `Site` | An author's full publication. Contains `title`, `url`, `urlPrefix`, `groups`, and `ungroupedArticles`. |
| `Article` | A single article. Contains `title`, `content` (HTML), `url`, `synopsis`, `createdAt`, `updatedAt`, and optional `splashImageUrl`. |
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

---

## License

[MIT](./LICENSE) — © 2025 Anthony Cregan
