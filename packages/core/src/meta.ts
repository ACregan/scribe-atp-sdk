import type { Article, Site } from "./types.js";

// A plain, JSON-serializable object — matches the shape consuming frameworks'
// own JSON-LD types expect (e.g. React Router's LdJsonObject) without this
// package depending on any framework's types directly.
export type JsonLdObject = {
  [key: string]: string | number | boolean | null | JsonLdObject | JsonLdObject[];
};

export type ScribeMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string }
  | { "script:ld+json": JsonLdObject };

export function buildCanonicalUrl(article: Article, site: Site): string {
  if (article.canonicalUrl) return article.canonicalUrl;
  const base = `https://${site.url.replace(/\/$/, "")}`;
  const prefix = site.urlPrefix ? `/${site.urlPrefix}` : "";
  const path = article.path.startsWith("/") ? article.path : `/${article.path}`;
  return `${base}${prefix}${path}`;
}

export function buildSiteUrl(site: Site): string {
  return `https://${site.url}${site.urlPrefix ? `/${site.urlPrefix}` : ""}`;
}

// Standalone so frameworks whose metadata API has no room for a raw
// <script> tag (e.g. Next.js's Metadata object) can still get the
// structured-data payload and render it themselves.
export function generateArticleJsonLd(article: Article, site: Site): JsonLdObject {
  const canonicalUrl = buildCanonicalUrl(article, site);
  const authorName = article.contributors?.[0]?.displayName ?? site.title;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: site.title,
      ...(site.logoImageUrl
        ? { logo: { "@type": "ImageObject", url: site.logoImageUrl } }
        : {}),
    },
  };
  if (article.description) jsonLd.description = article.description;
  if (article.coverImageUrl) jsonLd.image = article.coverImageUrl;
  if (article.tags?.length) jsonLd.keywords = article.tags.join(", ");
  return jsonLd;
}

export function generateSiteJsonLd(site: Site): JsonLdObject {
  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.title,
    url: buildSiteUrl(site),
  };
  if (site.description) jsonLd.description = site.description;
  return jsonLd;
}

export function generateArticleMeta(
  article: Article,
  site: Site,
): ScribeMetaTag[] {
  const canonicalUrl = buildCanonicalUrl(article, site);

  const tags: ScribeMetaTag[] = [
    { title: `${article.title} — ${site.title}` },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
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

  tags.push({ "script:ld+json": generateArticleJsonLd(article, site) });

  return tags;
}

export function generateSiteMeta(site: Site): ScribeMetaTag[] {
  const siteUrl = buildSiteUrl(site);
  const tags: ScribeMetaTag[] = [
    { title: site.title },
    { tagName: "link", rel: "canonical", href: siteUrl },
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

  tags.push({ "script:ld+json": generateSiteJsonLd(site) });

  return tags;
}
