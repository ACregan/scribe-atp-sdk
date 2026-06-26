# @scribe-atp/core

## 3.2.0

### Minor Changes

- Add `uri` field to `Site` type — `fetchSite` now returns the publication's own AT URI alongside its other fields. Needed by consumer sites to pass the publication AT URI to social action popups (subscribe button).

## 3.1.0

### Minor Changes

- Add `ArticleContributor` interface and `contributors`/`tags` fields to `Article`.

  New `ArticleContributor` type: `{ did: string; role?: string; displayName?: string }`.
  Both fields are optional and backwards-compatible with existing consumers.

## 3.0.2

### Patch Changes

- 93dcd2a: fetchSite reads description from top-level site.standard.publication field instead of scribe.description

## 3.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.

## 2.3.0

### Minor Changes

- Add `fetchArticleBySlug(author, siteSlug, slug)` to core, which resolves a human-readable slug to its TID rkey via the site manifest before fetching the article record. Returns `{ article, uri }` as `ArticleResult`.

  Remove `resolveDocumentUri` (assumed rkey === slug, which breaks after TID migration).

  Update `createArticleRouteLoader` signature to `(author, siteSlug, slugParam?)` — `siteSlug` is now required so the loader can use `fetchArticleBySlug`. Remove `createArticleLoader` (use `createArticleRouteLoader` or `fetchArticleBySlug` directly).

## 2.2.0

### Minor Changes

- Add `resolvePublicationUri` and `resolveDocumentUri` to support Standard.site discovery features.

  Both functions resolve an author handle (or DID) to a DID and return the AT URI for the publication or document record. Handle resolution is now cached at the module level to avoid redundant network calls on repeated requests (e.g. `.well-known` endpoint, article pages).

  Consumer sites can use these to implement:

  - A `/.well-known/site.standard.publication` resource route returning the publication AT URI
  - A `<link rel="site.standard.document">` tag on article pages pointing to the document record

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
