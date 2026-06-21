# ADR 0001 — Sitemap returns structured data, not XML

**Status:** Accepted  
**Date:** 2026-06-21

## Context

`generateSitemap` was added to `@scribe-atp/core` to help developers add sitemaps to their Scribe-powered sites. It produced a complete XML sitemap document.

The problem: the SDK only has visibility of Scribe content (site index, groups, articles). It has no knowledge of other pages in a consuming app (e.g. `/portfolio`, `/contact`, `/projects`). A sitemap that silently omits pages is arguably worse than no sitemap — it misleads crawlers about what exists.

`generateFeed` does not share this problem. An RSS feed is definitionally scoped to articles; there is no concept of a "complete" feed that must include non-article pages.

## Decision

Replace `generateSitemap` with `getSitemapEntries`, which returns `SitemapEntry[]` (structured data) instead of an XML string.

Each consuming framework already has its own sitemap solution (Next.js `sitemap.ts`, `@nuxtjs/sitemap`, etc.). `getSitemapEntries` provides the Scribe-specific URL data — with correct `urlPrefix` handling and `lastmod` dates — that developers merge into their own framework's sitemap generator.

No per-framework wrapper functions are provided. The adaptation from `SitemapEntry[]` to a framework's expected shape is trivial (often a single key rename) and is better taught by a code example than hidden behind an abstraction.

## Alternatives considered

1. **Remove sitemap support entirely** — clean, but discards the genuine value of URL construction and `lastmod` extraction from Scribe data.
2. **Extend `generateSitemap` to accept additional entries** — pulls the SDK toward owning the consuming app's full route inventory, which is out of scope and still requires the developer to enumerate all their own routes manually.
3. **Per-framework wrappers in adapter packages** — fragile; requires traversing each framework's route tree to resolve dynamic segments, and must be maintained as framework routing APIs evolve.

## Consequences

- `generateSitemap` is removed from `@scribe-atp/core` (breaking change, requires semver bump)
- `getSitemapEntries(site, options) → SitemapEntry[]` is the replacement
- SDK consumers integrate the returned entries with their framework's own sitemap tooling
- Each framework adapter's README documents a usage example
