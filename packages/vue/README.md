# @skyscribe-sdk/vue

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/vue)](https://www.npmjs.com/package/@skyscribe-sdk/vue)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Vue 3 composables for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Vue 3 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with idiomatic Vue 3 reactivity. Handles loading state, error state, and request cancellation automatically.

> **Building a Nuxt app?** Use [`@skyscribe-sdk/nuxt`](https://www.npmjs.com/package/@skyscribe-sdk/nuxt) instead — it builds on this package and adds auto-imports and `useAsyncData` integration.

## Installation

```bash
npm install @skyscribe-sdk/vue
```

## Usage

### `useScribeSite`

```vue
<script setup lang="ts">
import { useScribeSite } from "@skyscribe-sdk/vue";

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
import { useScribeArticle } from "@skyscribe-sdk/vue";

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

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/vue";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
