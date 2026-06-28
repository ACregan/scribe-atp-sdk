import type { Article, Site } from "@scribe-atp/core";
import { buildCanonicalUrl } from "@scribe-atp/core";

export function articleSeoMeta(article: Article, site: Site) {
  const canonicalUrl = buildCanonicalUrl(article, site);
  return {
    title: `${article.title} — ${site.title}`,
    ogType: "article" as const,
    ogTitle: article.title,
    ogDescription: article.description ?? undefined,
    ogUrl: canonicalUrl,
    ogSiteName: site.title,
    ogImage: article.splashImageUrl ?? undefined,
    twitterCard: (article.splashImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: article.title,
    twitterDescription: article.description ?? undefined,
    twitterImage: article.splashImageUrl ?? undefined,
  };
}

export function siteSeoMeta(site: Site) {
  const siteUrl = `https://${site.url}${site.urlPrefix ? `/${site.urlPrefix}` : ""}`;
  return {
    title: site.title,
    ogType: "website" as const,
    ogTitle: site.title,
    ogDescription: site.description ?? undefined,
    ogUrl: siteUrl,
    ogSiteName: site.title,
    ogImage: site.splashImageUrl ?? undefined,
    twitterCard: (site.splashImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: site.title,
    twitterDescription: site.description ?? undefined,
    twitterImage: site.splashImageUrl ?? undefined,
  };
}
