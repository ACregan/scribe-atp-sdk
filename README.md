# @scribe-atp/sdk

A monorepo of packages for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Authors write articles in Scribe CMS; this SDK is for developers who want to display that content in their own sites or apps.

## Packages

| Package | Description |
| ------- | ----------- |
| `@scribe-atp/core` | Pure TypeScript fetch functions, PDS resolution, types. No framework deps. |
| `@scribe-atp/react` | React hooks (`useSite`, `useArticle`) wrapping core. Requires React 18+. |
| `@scribe-atp/react-router-framework` | Loader factories for React Router v7 framework mode. |
| `@scribe-atp/angular` | Angular service and injection functions. Requires Angular 16+. |

---

## `@scribe-atp/core`

Framework-agnostic. Use this in any TypeScript/JavaScript project.

```bash
npm install @scribe-atp/core
```

### Fetch a site

```ts
import { fetchSite, toSlug } from "@scribe-atp/core";

// toSlug derives the site slug from the author's domain
const site = await fetchSite("alice.bsky.social", toSlug("alice.bsky.social"));

console.log(site.title);
console.log(site.groups); // published article groups
```

### Fetch an article

```ts
import { fetchArticle } from "@scribe-atp/core";

const article = await fetchArticle("alice.bsky.social", "my-first-post");

console.log(article.title);
console.log(article.content); // HTML string
```

### AbortSignal support

Both functions accept an optional `AbortSignal` as a third argument, which cancels the in-flight request:

```ts
const controller = new AbortController();
const site = await fetchSite("alice.bsky.social", "alice-bsky-social", controller.signal);

controller.abort(); // cancels the request
```

### Utilities

```ts
import { toSlug, slugFromUri, flattenArticles } from "@scribe-atp/core";

toSlug("norobots.blog");       // "norobots-blog"
slugFromUri("at://did:plc:.../app.scribe.article/my-post"); // "my-post"
flattenArticles(site.groups);  // ArticleRef[] from all groups combined
```

---

## `@scribe-atp/react`

React hooks wrapping `@scribe-atp/core`. Requires React 18 or later.

```bash
npm install @scribe-atp/react
```

### `useSite`

```tsx
import { useSite, toSlug } from "@scribe-atp/react";

function BlogIndex() {
  const { site, loading, error } = useSite("alice.bsky.social", toSlug("alice.bsky.social"));

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

Hooks abort in-flight requests automatically when the component unmounts or parameters change.

---

## `@scribe-atp/react-router-framework`

Loader factories for [React Router v7 framework mode](https://reactrouter.com). Not compatible with React Router SPA (library) mode — use `@scribe-atp/react` instead.

```bash
npm install @scribe-atp/react-router-framework
```

### `createSiteLoader`

Use this for routes that display the full site index. The loader is wired up once with your author and site slug:

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

### Dynamic article routes

For dynamic routes where the slug comes from URL params, use `fetchArticle` from `@scribe-atp/core` directly inside your loader:

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

Angular service and injection functions wrapping `@scribe-atp/core`. Requires Angular 16 or later. Provides two APIs — pick whichever fits your component style.

```bash
npm install @scribe-atp/angular
```

### Observable API — `ScribeService`

`ScribeService` is provided in the root injector (`providedIn: 'root'`) and returns cold Observables. Unsubscribing cancels the in-flight request automatically.

```ts
// blog.component.ts
import { Component, OnInit, OnDestroy } from "@angular/core";
import { ScribeService } from "@scribe-atp/angular";
import type { Site } from "@scribe-atp/angular";
import { Subscription } from "rxjs";

@Component({
  selector: "app-blog",
  template: `
    <p *ngIf="loading">Loading...</p>
    <p *ngIf="error">{{ error.message }}</p>
    <ul *ngIf="site">
      <li *ngFor="let group of site.groups">{{ group.title }}</li>
    </ul>
  `,
})
export class BlogComponent implements OnInit, OnDestroy {
  site: Site | null = null;
  loading = true;
  error: Error | null = null;

  private sub: Subscription | undefined;

  constructor(private scribe: ScribeService) {}

  ngOnInit() {
    this.sub = this.scribe.getSite("alice.bsky.social", "alice-bsky-social").subscribe({
      next: (site) => { this.site = site; this.loading = false; },
      error: (err) => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

Or compose with the `async` pipe for automatic subscription management:

```ts
@Component({
  template: `
    <ng-container *ngIf="site$ | async as site">
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

### Signals API — `injectSite` / `injectArticle`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component or injector is destroyed.

```ts
// article.component.ts
import { Component } from "@angular/core";
import { injectArticle } from "@scribe-atp/angular";

@Component({
  selector: "app-article",
  template: `
    <p *ngIf="vm.loading()">Loading...</p>
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

`injectSite` follows the same pattern:

```ts
vm = injectSite("alice.bsky.social", "alice-bsky-social");
// vm.site(), vm.loading(), vm.error() — all readonly signals
```

> **Note:** Injection functions must be called in an injection context — inside a constructor, field initialiser, or `runInInjectionContext()`. They cannot be called inside lifecycle hooks or event handlers.

---

## Contributing

See [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md) for the day-to-day development workflow.
