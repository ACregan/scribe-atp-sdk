# Planning

## Reconsider `generateSitemap` scope

`generateSitemap` only knows about Scribe content (site index, groups, articles). It has no visibility of other pages a consuming site may have (e.g. `/portfolio`, `/contact`, `/projects`). A sitemap that silently omits pages is arguably worse than none.

Options:
- **Remove it** — let each site own its sitemap; `flattenArticles` gives article URLs if needed
- **Rename/reframe** as `generateArticleSitemap` to make the partial scope explicit, with a doc note that it must be merged with the site's own routes

`generateFeed` is not affected — an RSS feed is inherently scoped to articles.

Do not deploy `generateSitemap` to anthonycregan.co.uk-2025 until this is resolved.

---

## Consumer site integrations

Wire up `generateFeed` and `generateSitemap` from `@scribe-atp/core` (published in v1.1.0) across all three consumer sites.

### norobots

- [x] Add RSS feed route using `generateFeed`
- [x] Add sitemap route using `generateSitemap`

### perpetual-summer-ltd

- [ ] Add RSS feed route using `generateFeed`
- [ ] Add sitemap route using `generateSitemap`

### anthonycregan.co.uk-2025

- [ ] Add RSS feed route using `generateFeed`
- [ ] Add sitemap route using `generateSitemap`
