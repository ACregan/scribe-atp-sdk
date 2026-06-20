---
"@scribe-atp/core": patch
---

Fix `generateSitemap` not including the homepage URL. Sites with a `urlPrefix` (e.g. blog at `/blog`) now correctly emit both the root `/` and the blog index as separate entries.
