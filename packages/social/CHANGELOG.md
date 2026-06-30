# @scribe-atp/social

## 1.3.0

### Minor Changes

- Add `ShareButton` component, `children` render prop, `onSuccess` callback, `defaultLiked`/`defaultSubscribed` SSR props, and `aria-pressed` accessibility improvements to `@scribe-atp/social`.

  - **`ShareButton`** — new component for sharing articles to Bluesky via popup OAuth
  - **`children`** — all three buttons now accept a render prop `(state: boolean) => ReactNode` or static `ReactNode` to customise the button label
  - **`onSuccess`** — callback fired on all three buttons after a successful like, share, or subscription
  - **`defaultLiked` / `defaultSubscribed`** — pass initial state from an SSR loader to avoid a flash of unconfirmed state on first render
  - **`className`** — all three buttons now accept an optional class to append alongside the base `scribe-atp-*` class
  - **Accessibility** — `LikeButton` and `SubscribeButton` now use `aria-pressed` instead of `disabled`, keeping the button in the tab order after activation
  - **`publicationUri`** (breaking) — `LikeButton` now requires a `publicationUri` prop so the social service can record which publication a like belongs to; pass `site.uri` from the SDK

## 1.2.0

### Minor Changes

- Add `ShareButton` component — lets readers share articles to their own Bluesky feed via popup OAuth. Creates an `app.bsky.feed.post` with `app.bsky.embed.external` and `associatedRefs` pointing to the `site.standard.document` and `site.standard.publication` records for rich card support.

## 1.1.1

### Patch Changes

- Fix LikeButton and SubscribeButton not updating after OAuth — poll /status/:token when popup closes as fallback for COOP-blocked postMessage

## 1.1.0

### Minor Changes

- Like and Subscribe buttons
