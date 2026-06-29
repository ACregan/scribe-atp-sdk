# @scribe-atp/react-router-framework

[![npm](https://img.shields.io/npm/v/@scribe-atp/react-router-framework)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Loader factories for reading [Scribe CMS](https://scribe-cms.app) content in [React Router v7 framework mode](https://reactrouter.com).

Fetches content on the server, passes it to your route component via `useLoaderData`, and wires up request cancellation via `request.signal` automatically. No client-side loading states.

> **Not compatible with React Router SPA (library) mode.** For client-rendered React, use [`@scribe-atp/react`](https://www.npmjs.com/package/@scribe-atp/react) instead.

## Installation

```bash
npm install @scribe-atp/react-router-framework
```

## Usage

### Site index route

```ts
// app/routes/blog.tsx
import { createSiteLoader } from "@scribe-atp/react-router-framework";
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

Use `createArticleRouteLoader` for routes where the slug comes from URL params. It resolves the article and returns `{ ...article, documentUri }` — the AT URI is included so you can pass it to `@scribe-atp/social`'s `LikeButton`.

```ts
// app/routes/blog.$articleSlug.tsx
import { createArticleRouteLoader } from "@scribe-atp/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createArticleRouteLoader(
  "alice.bsky.social",
  "https://alice.bsky.social"
);

export default function Article() {
  const { title, content, documentUri } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

The third argument lets you customise the route param name (defaults to `"articleSlug"`):

```ts
export const loader = createArticleRouteLoader("alice.bsky.social", "https://alice.bsky.social", "slug");
```

### AT Protocol well-known route

`createWellKnownLoader` serves the author's publication AT URI at a `/.well-known/` endpoint — required for AT Protocol client discovery:

```ts
// app/routes/well-known.ts
import { createWellKnownLoader } from "@scribe-atp/react-router-framework";

export const loader = createWellKnownLoader("alice.bsky.social", "https://alice.bsky.social");
```

### Open Graph and Twitter Card meta tags

`articleMeta` and `siteMeta` return a `MetaDescriptor[]` array ready to spread into a React Router v7 `meta` function. They produce Open Graph and Twitter Card tags for rich link previews on Bluesky and other platforms.

```ts
import { articleMeta } from "@scribe-atp/react-router-framework";
import type { Route } from "./+types/Article";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "My Blog" }];
  return [
    ...articleMeta(loaderData.article, loaderData.site),
    { title: `${loaderData.article.title} — My Blog` },
  ];
}
```

`siteMeta` covers site index and group pages:

```ts
import { siteMeta } from "@scribe-atp/react-router-framework";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "My Blog" }];
  return [
    ...siteMeta(loaderData.site),
    { title: "My Blog" },
  ];
}
```

Both functions require the `Site` object from the loader — include it in your loader return if it isn't there already.

## TypeScript types

All types from `@scribe-atp/core` are re-exported, plus `ArticleWithUri`:

```ts
import type { Site, Article, ArticleRef, SiteGroup, ArticleWithUri } from "@scribe-atp/react-router-framework";
```

`ArticleWithUri` is the return type of `createArticleRouteLoader` — it extends `Article` with `documentUri: string`.

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
