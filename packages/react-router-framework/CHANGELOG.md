# @scribe-atp/react-router-framework

## 2.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.
- Updated dependencies [7b9ec3e]
  - @scribe-atp/core@3.0.1

## 1.3.0

### Minor Changes

- Add `fetchArticleBySlug(author, siteSlug, slug)` to core, which resolves a human-readable slug to its TID rkey via the site manifest before fetching the article record. Returns `{ article, uri }` as `ArticleResult`.

  Remove `resolveDocumentUri` (assumed rkey === slug, which breaks after TID migration).

  Update `createArticleRouteLoader` signature to `(author, siteSlug, slugParam?)` — `siteSlug` is now required so the loader can use `fetchArticleBySlug`. Remove `createArticleLoader` (use `createArticleRouteLoader` or `fetchArticleBySlug` directly).

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@2.3.0

## 1.2.0

### Minor Changes

- Add Standard.site discovery support to all framework adapters.

  Each adapter exposes framework-idiomatic helpers for the two discovery URIs introduced in `@scribe-atp/core` 2.2.0:

  - **react-router-framework**: `createWellKnownLoader(author, siteSlug)` returns a resource-route loader that serves the publication AT URI as plain text; `createArticleRouteLoader(author)` returns an article loader that also resolves and returns `documentUri`.
  - **next**: `createScribeSite` return object gains `getDocumentUri(articleSlug)`; `createWellKnownHandler(author, siteSlug)` returns an App Router route handler for the `.well-known` endpoint.
  - **vue**: `useScribeDocumentUri(author, articleSlug)` and `useScribePublicationUri(author, siteSlug)` composables with `uri`/`loading`/`error` refs.
  - **nuxt**: `useScribeDocumentUri` and `useScribePublicationUri` composables wrapping `useAsyncData`, auto-imported by the module.
  - **angular**: `ScribeService` gains `getDocumentUri` and `getPublicationUri` Observable methods; `injectDocumentUri` and `injectPublicationUri` injection functions expose the same via Signals.

## 1.1.0

### Minor Changes

- Migrate ArticleRef and Article field names to standard.site lexicon shape

  **Breaking changes in `@scribe-atp/core`:**

  - `ArticleRef.url` renamed to `ArticleRef.slug`
  - `ArticleRef.synopsis` renamed to `ArticleRef.description`
  - `Article.url` renamed to `Article.slug`
  - `Article.synopsis` renamed to `Article.description`
  - New optional fields on `ArticleRef`: `publishedAt`, `tags`
  - `Article.content` now transparently unwraps `app.scribe.content.html` union records in addition to accepting raw strings

  Framework adapters receive a minor bump as they re-export the updated types from core.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@2.0.0

## 1.0.1

### Patch Changes

- Add per-package README files so each package page on npm displays documentation.
- Updated dependencies
  - @scribe-atp/core@1.0.1

## 1.0.0

### Major Changes

- a1aebbc: Stable 1.0.0 release. PDS resolution, AbortSignal support, and framework adapters are production-tested across multiple live sites.

### Patch Changes

- Updated dependencies [a1aebbc]
  - @scribe-atp/core@1.0.0
