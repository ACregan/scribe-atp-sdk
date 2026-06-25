# @scribe-atp/next

[![npm](https://img.shields.io/npm/v/@scribe-atp/next)](https://www.npmjs.com/package/@scribe-atp/next)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Next.js App Router adapter for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Requires Next.js 13 or later.

Wraps [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) with Next.js-idiomatic factories for `generateStaticParams` and `generateMetadata`.

> **App Router only.** For Pages Router support, use [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) directly — see [Pages Router](#pages-router) below.

## Installation

```bash
npm install @scribe-atp/next
```

## Usage

Create a factory once and export its functions from your route files:

```ts
// lib/scribe.ts
import { createScribeSite } from "@scribe-atp/next";

export const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
```

### Group index route — `/blog/[groupSlug]`

```ts
// app/blog/[groupSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateGroupParams;
// → [{ groupSlug: "tech" }, { groupSlug: "life" }]

export const generateMetadata = ({ params }: { params: { groupSlug: string } }) =>
  scribe.generateGroupMetadata(params.groupSlug);

export default function GroupPage({ params }: { params: { groupSlug: string } }) {
  // ...
}
```

### Article route — `/blog/[groupSlug]/[articleSlug]`

```ts
// app/blog/[groupSlug]/[articleSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateGroupArticleParams;
// → [{ groupSlug: "tech", articleSlug: "hello" }, ...]

export const generateMetadata = ({ params }: { params: { articleSlug: string } }) =>
  scribe.generateArticleMetadata(params.articleSlug);

export default function ArticlePage({ params }: { params: { groupSlug: string; articleSlug: string } }) {
  // ...
}
```

### Flat article route — `/blog/[articleSlug]`

```ts
// app/blog/[articleSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateArticleParams;
// → [{ articleSlug: "hello" }, { articleSlug: "second" }, ...]
```

### Site index metadata

```ts
// app/blog/page.tsx
import { scribe } from "@/lib/scribe";

export const generateMetadata = scribe.generateSiteMetadata;
```

## Metadata

The metadata generators are opinionated by design. They produce complete, ready-to-use `Metadata` objects including OpenGraph tags — you don't need to wire these up manually.

| Generator | `title` | `description` | OpenGraph |
| --------- | ------- | ------------- | --------- |
| `generateSiteMetadata` | `site.title` | `site.description` | title, description, splash image |
| `generateGroupMetadata` | `"Group — Site"` | — | title |
| `generateArticleMetadata` | `"Article — Site"` | `article.synopsis` | title, description, splash image |

Article metadata uses the cached `ArticleRef` snapshot already present in the site record — no extra network request per article at build time.

**Need custom metadata?** Call `fetchSite` or `fetchArticle` from `@scribe-atp/core` directly and compose your own `Metadata` object:

```ts
import { fetchSite } from "@scribe-atp/core";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");
  return {
    title: `${site.title} | My Platform`,
    // custom fields...
  };
}
```

## ISR (Incremental Static Regeneration)

The SDK does not configure Next.js fetch caching. Use Next.js [route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) to control revalidation:

```ts
// app/blog/[groupSlug]/[articleSlug]/page.tsx
export const revalidate = 3600; // revalidate every hour
```

## Pages Router

`@scribe-atp/next` targets the App Router only. For Pages Router, use `@scribe-atp/core` directly:

```ts
// pages/blog/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { fetchSite, fetchArticle } from "@scribe-atp/core";

export const getStaticPaths: GetStaticPaths = async () => {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");
  const paths = site.groups.flatMap((group) =>
    group.articles.map((article) => ({ params: { slug: article.url ?? "" } }))
  );
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const article = await fetchArticle("alice.bsky.social", params!.slug as string);
  return { props: { article } };
};
```

## TypeScript types

All types from `@scribe-atp/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/next";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
