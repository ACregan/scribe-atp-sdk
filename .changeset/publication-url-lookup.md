---
"@scribe-atp/core": major
"@scribe-atp/react": major
"@scribe-atp/react-router-framework": major
"@scribe-atp/angular": major
"@scribe-atp/next": major
"@scribe-atp/vue": major
"@scribe-atp/nuxt": major
---

**Breaking:** `siteSlug` parameter replaced by `publicationUrl` (full URL, no trailing slash) in `fetchSite`, `fetchArticleBySlug`, and `resolvePublicationUri`.

`fetchSite` now discovers publications via `listRecords(site.standard.publication)` filtered by the spec's `url` field rather than constructing a slug-based AT URI directly. This makes the SDK work with TID-keyed publication records and is backward-compatible with slug-keyed records.

`resolvePublicationUri` moved from `resolve.ts` to `fetch.ts` — it now returns a TID-based AT URI resolved via the same `listRecords` lookup.

Migration: replace `fetchSite(author, "my-site-slug")` with `fetchSite(author, "https://my-site.example.com")`.
