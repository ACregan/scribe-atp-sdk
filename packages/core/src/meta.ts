import type { Article, Site } from "./types.js";

export type ScribeMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export function buildCanonicalUrl(article: Article, site: Site): string {
  if (article.canonicalUrl) return article.canonicalUrl;
  const base = `https://${site.url.replace(/\/$/, "")}`;
  const prefix = site.urlPrefix ? `/${site.urlPrefix}` : "";
  const path = article.path.startsWith("/") ? article.path : `/${article.path}`;
  return `${base}${prefix}${path}`;
}

export function generateArticleMeta(
  article: Article,
  site: Site,
): ScribeMetaTag[] {
  const canonicalUrl = buildCanonicalUrl(article, site);
  const tags: ScribeMetaTag[] = [
    { title: `${article.title} — ${site.title}` },
    { property: "og:type", content: "article" },
    { property: "og:title", content: article.title },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: site.title },
    { name: "twitter:title", content: article.title },
    {
      name: "twitter:card",
      content: article.coverImageUrl ? "summary_large_image" : "summary",
    },
  ];

  if (article.description) {
    tags.push({ name: "description", content: article.description });
    tags.push({ property: "og:description", content: article.description });
    tags.push({ name: "twitter:description", content: article.description });
  }

  if (article.coverImageUrl) {
    tags.push({ property: "og:image", content: article.coverImageUrl });
    tags.push({ name: "twitter:image", content: article.coverImageUrl });
  }

  return tags;
}

export function generateSiteMeta(site: Site): ScribeMetaTag[] {
  const siteUrl = `https://${site.url}${site.urlPrefix ? `/${site.urlPrefix}` : ""}`;
  const tags: ScribeMetaTag[] = [
    { title: site.title },
    { property: "og:type", content: "website" },
    { property: "og:title", content: site.title },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: site.title },
    { name: "twitter:title", content: site.title },
    {
      name: "twitter:card",
      content: site.splashImageUrl ? "summary_large_image" : "summary",
    },
  ];

  if (site.description) {
    tags.push({ name: "description", content: site.description });
    tags.push({ property: "og:description", content: site.description });
    tags.push({ name: "twitter:description", content: site.description });
  }

  if (site.splashImageUrl) {
    tags.push({ property: "og:image", content: site.splashImageUrl });
    tags.push({ name: "twitter:image", content: site.splashImageUrl });
  }

  return tags;
}
