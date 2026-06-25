# @scribe-atp/nuxt

[![npm](https://img.shields.io/npm/v/@scribe-atp/nuxt)](https://www.npmjs.com/package/@scribe-atp/nuxt)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Nuxt 3 module for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Requires Nuxt 3 or later.

Wraps [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) with Nuxt-idiomatic `useAsyncData` composables and auto-imports — no explicit imports needed in your components or pages.

## Installation

```bash
npm install @scribe-atp/nuxt
```

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@scribe-atp/nuxt"],
});
```

## Usage

The composables are auto-imported globally — no import statement needed:

### `useScribeSite`

```vue
<!-- pages/blog/index.vue -->
<script setup lang="ts">
const { data: site, pending, error } = await useScribeSite(
  "alice.bsky.social",
  "https://alice.bsky.social"
);
</script>

<template>
  <div v-if="pending">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="group in site!.groups" :key="group.slug">
      {{ group.title }}
    </li>
  </ul>
</template>
```

### `useScribeArticle`

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: article, pending, error } = await useScribeArticle(
  "alice.bsky.social",
  route.params.slug as string
);
</script>

<template>
  <article v-if="article">
    <h1>{{ article.title }}</h1>
    <div v-html="article.content" />
  </article>
</template>
```

The composables return the full `useAsyncData` result shape: `{ data, pending, error, refresh, ... }`.

### Deferred loading with `lazy`

Pass `useAsyncData` options as an optional third argument:

```ts
const { data: site, pending } = useScribeSite(
  "alice.bsky.social",
  "https://alice.bsky.social",
  { lazy: true }
);
```

## ISR (Incremental Static Regeneration)

Use Nuxt's [`routeRules`](https://nuxt.com/docs/guide/concepts/rendering#route-rules) in `nuxt.config.ts` to control revalidation:

```ts
export default defineNuxtConfig({
  modules: ["@scribe-atp/nuxt"],
  routeRules: {
    "/blog/**": { swr: 3600 }, // revalidate every hour
  },
});
```

## Auto-imports

Only the composables are auto-imported: `useScribeSite` and `useScribeArticle`.

Utility functions require an explicit import:

```ts
import { toSlug, flattenArticles } from "@scribe-atp/core";
```

## TypeScript types

All types from `@scribe-atp/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/nuxt";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
