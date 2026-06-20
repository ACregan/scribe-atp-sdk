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

For routes where the slug comes from URL params, use `fetchArticle` from `@scribe-atp/core` directly:

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

## TypeScript types

All types from `@scribe-atp/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/react-router-framework";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
