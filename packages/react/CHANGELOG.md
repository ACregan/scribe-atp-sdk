# @scribe-atp/react

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
