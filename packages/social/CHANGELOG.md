# @scribe-atp/social

## 1.2.0

### Minor Changes

- Add `ShareButton` component — lets readers share articles to their own Bluesky feed via popup OAuth. Creates an `app.bsky.feed.post` with `app.bsky.embed.external` and `associatedRefs` pointing to the `site.standard.document` and `site.standard.publication` records for rich card support.

## 1.1.1

### Patch Changes

- Fix LikeButton and SubscribeButton not updating after OAuth — poll /status/:token when popup closes as fallback for COOP-blocked postMessage

## 1.1.0

### Minor Changes

- Like and Subscribe buttons
