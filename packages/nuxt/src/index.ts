export { default } from "./module.js";
export { articleSeoMeta, siteSeoMeta } from "./composables/seoMeta.js";
// useSeoMeta() has no field for a canonical link or structured data — wire
// these into useHead() yourself:
//   useHead({
//     link: [{ rel: "canonical", href: buildCanonicalUrl(article, site) }],
//     script: [{ type: "application/ld+json", innerHTML: JSON.stringify(generateArticleJsonLd(article, site)) }],
//   })
export {
  buildCanonicalUrl,
  buildSiteUrl,
  generateArticleJsonLd,
  generateSiteJsonLd,
} from "@scribe-atp/core";
export type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/core";
