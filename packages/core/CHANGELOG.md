# @scribe-atp/core

## 1.1.1

### Patch Changes

- 0907fc0: Replace `generateSitemap` with `getSitemapEntries`, which returns `SitemapEntry[]` instead of an XML string. This correctly scopes the SDK to Scribe content — consumers merge the returned entries into their own framework's sitemap generator alongside their non-Scribe pages.

## 1.1.0

### Minor Changes

- Add `generateFeed` and `generateSitemap` utility functions for generating RSS 2.0 feeds and XML sitemaps from a Scribe site record.

## 1.0.1

### Patch Changes

- Add per-package README files so each package page on npm displays documentation.

## 1.0.0

### Major Changes

- a1aebbc: Stable 1.0.0 release. PDS resolution, AbortSignal support, and framework adapters are production-tested across multiple live sites.
