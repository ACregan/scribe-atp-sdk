# @scribe-atp/sdk

> **Early development — not production ready.** The API is unstable and packages have not yet been published to npm.

A monorepo of packages for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Authors write articles in Scribe CMS; this SDK is for developers who want to display that content in their own sites or apps.

## Packages

| Package | Description | Status |
| ------- | ----------- | ------ |
| `@scribe-atp/core` | Pure TypeScript fetch functions, PDS resolution, types | In development |
| `@scribe-atp/react` | React hooks wrapping core | In development |
| `@scribe-atp/react-router-framework` | Loader factories for React Router v7 framework mode | In development |

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

---

## `@scribe-atp/react-router-framework`

Loader factories for [React Router v7 framework mode](https://reactrouter.com). Not compatible with React Router SPA (library) mode — use `@scribe-atp/react` instead.

```bash
npm install @scribe-atp/react-router-framework
```

### `createSiteLoader`

```ts
// app/routes/blog.tsx
import { createSiteLoader } from "@scribe-atp/react-router-framework";
import { useLoaderData } from "react-router";
import type { Site } from "@scribe-atp/react-router-framework";

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

### `createArticleLoader`

```ts
// app/routes/blog.$slug.tsx
import { createArticleLoader } from "@scribe-atp/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createArticleLoader("alice.bsky.social", "my-first-post");

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

## Contributing

See [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md) for the day-to-day development workflow.
