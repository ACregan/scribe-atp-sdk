# @scribe-atp/next

## 1.1.0

### Minor Changes

- Export `buildCanonicalUrl` from `@scribe-atp/core`. Add `articleMetadata` and `siteMetadata` to `@scribe-atp/next`, returning Next.js `Metadata` objects for use in `generateMetadata`. Add `articleSeoMeta` and `siteSeoMeta` to `@scribe-atp/nuxt`, returning objects shaped for Nuxt's `useSeoMeta` composable.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@3.3.1

## 1.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.
- Updated dependencies [7b9ec3e]
  - @scribe-atp/core@3.0.1

## 0.3.0

### Minor Changes

- Add Standard.site discovery support to all framework adapters.

  Each adapter exposes framework-idiomatic helpers for the two discovery URIs introduced in `@scribe-atp/core` 2.2.0:

  - **react-router-framework**: `createWellKnownLoader(author, siteSlug)` returns a resource-route loader that serves the publication AT URI as plain text; `createArticleRouteLoader(author)` returns an article loader that also resolves and returns `documentUri`.
  - **next**: `createScribeSite` return object gains `getDocumentUri(articleSlug)`; `createWellKnownHandler(author, siteSlug)` returns an App Router route handler for the `.well-known` endpoint.
  - **vue**: `useScribeDocumentUri(author, articleSlug)` and `useScribePublicationUri(author, siteSlug)` composables with `uri`/`loading`/`error` refs.
  - **nuxt**: `useScribeDocumentUri` and `useScribePublicationUri` composables wrapping `useAsyncData`, auto-imported by the module.
  - **angular**: `ScribeService` gains `getDocumentUri` and `getPublicationUri` Observable methods; `injectDocumentUri` and `injectPublicationUri` injection functions expose the same via Signals.

## 0.2.0

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
