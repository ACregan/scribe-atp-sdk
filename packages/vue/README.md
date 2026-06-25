# @scribe-atp/vue

[![npm](https://img.shields.io/npm/v/@scribe-atp/vue)](https://www.npmjs.com/package/@scribe-atp/vue)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Vue 3 composables for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Requires Vue 3 or later.

Wraps [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) with idiomatic Vue 3 reactivity. Handles loading state, error state, and request cancellation automatically.

> **Building a Nuxt app?** Use [`@scribe-atp/nuxt`](https://www.npmjs.com/package/@scribe-atp/nuxt) instead — it builds on this package and adds auto-imports and `useAsyncData` integration.

## Installation

```bash
npm install @scribe-atp/vue
```

## Usage

### `useScribeSite`

```vue
<script setup lang="ts">
import { useScribeSite } from "@scribe-atp/vue";

const { site, loading, error } = useScribeSite(
  "alice.bsky.social",
  "https://alice.bsky.social"
);
</script>

<template>
  <div v-if="loading">Loading…</div>
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
<script setup lang="ts">
import { useScribeArticle } from "@scribe-atp/vue";

const props = defineProps<{ author: string; slug: string }>();
const { article, loading, error } = useScribeArticle(props.author, props.slug);
</script>

<template>
  <div v-if="loading">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <article v-else>
    <h1>{{ article!.title }}</h1>
    <div v-html="article!.content" />
  </article>
</template>
```

Both composables abort the in-flight request automatically when the component is unmounted.

## TypeScript types

All types from `@scribe-atp/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/vue";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
