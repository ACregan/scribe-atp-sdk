# @scribe-atp/core

## 2.1.0

### Minor Changes

- feat: read from site.standard.publication

  Fetch and list sites from site.standard.publication instead of app.scribe.site. Site records now store the Scribe manifest in a nested scribe extension field; scribe.domain maps to url and scribe.basePath maps to urlPrefix in the output — no breaking change for consumer sites.

  Adds optional canonicalUrl field to the Article type, passed through from site.standard.document records.

## 2.0.0

### Major Changes

- Migrate ArticleRef and Article field names to standard.site lexicon shape

  **Breaking changes in `@scribe-atp/core`:**

  - `ArticleRef.url` renamed to `ArticleRef.slug`
  - `ArticleRef.synopsis` renamed to `ArticleRef.description`
  - `Article.url` renamed to `Article.slug`
  - `Article.synopsis` renamed to `Article.description`
  - New optional fields on `ArticleRef`: `publishedAt`, `tags`
  - `Article.content` now transparently unwraps `app.scribe.content.html` union records in addition to accepting raw strings

  Framework adapters receive a minor bump as they re-export the updated types from core.

## 1.2.0

### Minor Changes

- Add `listSites` and `listArticles` functions for discovering all of an author's content.

  Both functions call `com.atproto.repo.listRecords` on the author's PDS and handle cursor-based pagination automatically. `listSites` returns `SiteRecord[]` (a `Site` with a `uri` field). `listArticles` returns `ArticleRef[]`. Cross-referencing the two lets callers identify draft articles — those not referenced in any site record.

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
