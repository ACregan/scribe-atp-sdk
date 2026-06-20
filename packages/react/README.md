# @scribe-atp/react

[![npm](https://img.shields.io/npm/v/@scribe-atp/react)](https://www.npmjs.com/package/@scribe-atp/react)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/scribe-atp/sdk/blob/main/LICENSE)

React hooks for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Requires React 18 or later.

Wraps [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) with idiomatic React state management. Handles loading state, error state, and request cancellation automatically — re-fetches when parameters change and aborts in-flight requests on unmount.

## Installation

```bash
npm install @scribe-atp/react
```

## Usage

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

## TypeScript types

All types from `@scribe-atp/core` are re-exported so you only need one import:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/react";
```

## Using with server-side rendering

If you're using React Router v7 framework mode, consider [`@scribe-atp/react-router-framework`](https://www.npmjs.com/package/@scribe-atp/react-router-framework) instead — it fetches on the server and avoids client-side loading states entirely.

For Next.js App Router or other SSR frameworks, use [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) directly in your server components or page loaders.

## License

[MIT](https://github.com/scribe-atp/sdk/blob/main/LICENSE)
