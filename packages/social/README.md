# @scribe-atp/social

[![npm](https://img.shields.io/npm/v/@scribe-atp/social)](https://www.npmjs.com/package/@scribe-atp/social)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

React components for adding social interactions — likes and subscriptions — to [Scribe CMS](https://scribe-cms.app) articles. Works with any React-based framework (React Router, Next.js, etc.).

Interactions are powered by the AT Protocol via `social.scribe-atp.app`. When a user clicks Like or Subscribe, a popup opens for them to sign in with their Bluesky account. The result is written to their AT Protocol repository and reported back to the originating page.

## Installation

```bash
npm install @scribe-atp/social
```

Requires React 18 or later as a peer dependency.

## Components

### `LikeButton`

Creates an AT Protocol `app.bsky.feed.like` record ("recommend") for an article when clicked.

```tsx
import { LikeButton } from "@scribe-atp/social";

<LikeButton
  documentUri="at://did:plc:abc123/site.standard.document/3jxtctq7kqm2y"
  title="My Article Title"
/>
```

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `documentUri` | `string` | ✓ | AT URI of the `site.standard.document` record |
| `title` | `string` | ✓ | Article title — shown in the like popup |
| `serviceUrl` | `string` | — | Override the social service URL. Defaults to `https://social.scribe-atp.app` |

### `SubscribeButton`

Follows the author's publication on the AT Protocol when clicked.

```tsx
import { SubscribeButton } from "@scribe-atp/social";

<SubscribeButton
  publicationUri="at://did:plc:abc123/site.standard.publication/3xyz789"
  title="My Site"
/>
```

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `publicationUri` | `string` | ✓ | AT URI of the `site.standard.publication` record |
| `title` | `string` | ✓ | Publication name — shown in the subscribe popup |
| `serviceUrl` | `string` | — | Override the social service URL. Defaults to `https://social.scribe-atp.app` |

## How it works

1. The user clicks the button. A popup window opens at `social.scribe-atp.app` with the relevant AT URI and a one-time token.
2. The user signs in with their Bluesky account via AT Protocol OAuth.
3. On success, the service writes the like or follow record, then notifies the originating page — via `postMessage` if the popup has access to `window.opener`, or via polling `/status/:token` as a fallback.
4. The button updates to its confirmed state (`Liked ✓` / `Subscribed ✓`) and the result is persisted to `localStorage` so it remains confirmed on future visits.

## Getting the AT URIs

Use `fetchArticleBySlug` and `fetchSite` from `@scribe-atp/core` to obtain the URIs needed by the components:

```ts
import { fetchArticleBySlug, fetchSite } from "@scribe-atp/core";

const [{ uri: documentUri }, site] = await Promise.all([
  fetchArticleBySlug(author, siteUrl, articleSlug, signal),
  fetchSite(author, siteUrl, signal),
]);

// documentUri → pass to LikeButton
// site.uri    → pass to SubscribeButton
```

## Storage utilities

Exported for cases where you need to read or set liked/subscribed state outside the components:

```ts
import { isRecommended, markRecommended, isSubscribed, markSubscribed } from "@scribe-atp/social";

isRecommended("at://...");  // → boolean
markRecommended("at://...");

isSubscribed("at://...");   // → boolean
markSubscribed("at://...");
```

`localStorage` access is wrapped in a try/catch — safe to call during SSR where storage is unavailable.

State is stored under the keys `scribe:recommended:{documentUri}` and `scribe:subscribed:{publicationUri}`.

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
