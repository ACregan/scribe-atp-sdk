# ADR 0002 — TID rkeys for site.standard.document records

**Status:** Accepted
**Date:** 2026-06-25

The `site.standard.document` lexicon specifies `"key": "tid"` — records must use PDS-generated Timestamp Identifiers as their rkeys, not human-readable slugs. Scribe originally used the article slug as the rkey (e.g. `the-crows-of-shenton-way`) because it was simpler and the PDS accepted it. The standard.site validation checker flags this as a conformance failure.

We publish articles by calling `createRecord` without an explicit rkey so the PDS generates a TID automatically. The human-readable slug is preserved as a `slug` field in the document record and in `ArticleRef.slug` inside the Site manifest. Consumer sites look up articles by slug via `fetchArticleBySlug(author, siteSlug, slug)`, which resolves slug → TID through the Site manifest, then fetches the document by TID.

**Consequences:**
- Article slugs and rkeys are now distinct concepts. The slug is the URL component; the rkey is an opaque TID.
- `fetchArticleBySlug` requires fetching the Site manifest before fetching the article (two requests instead of one). Acceptable because the manifest is small and the lookup is transparent to consumer sites.
- `resolveDocumentUri(author, slug)` was removed in the same release — it assumed rkey = slug and would silently return wrong URIs for TID-keyed records.
- Existing slug-keyed records must be migrated via a devtools script (create new TID-keyed record, update all ArticleRef URIs in site manifests, delete old record).
- `site.standard.publication` records also require TID rkeys per the lexicon. That migration is deferred — it requires deeper SDK API changes and is tracked separately.
