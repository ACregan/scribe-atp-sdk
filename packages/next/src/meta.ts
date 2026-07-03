import type { Metadata } from "next";
import type { Article, Site } from "@scribe-atp/core";
import { buildCanonicalUrl } from "@scribe-atp/core";

export function articleMetadata(article: Article, site: Site): Metadata {
  const canonicalUrl = buildCanonicalUrl(article, site);
  return {
    title: `${article.title} — ${site.title}`,
    description: article.description ?? undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description ?? undefined,
      url: canonicalUrl,
      siteName: site.title,
      ...(article.coverImageUrl ? { images: [article.coverImageUrl] } : {}),
    },
    twitter: {
      card: article.coverImageUrl ? "summary_large_image" : "summary",
      title: article.title,
      description: article.description ?? undefined,
      ...(article.coverImageUrl ? { images: [article.coverImageUrl] } : {}),
    },
  };
}

export function siteMetadata(site: Site): Metadata {
  const siteUrl = `https://${site.url}${site.urlPrefix ? `/${site.urlPrefix}` : ""}`;
  return {
    title: site.title,
    description: site.description ?? undefined,
    openGraph: {
      type: "website",
      title: site.title,
      description: site.description ?? undefined,
      url: siteUrl,
      siteName: site.title,
      ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
    },
    twitter: {
      card: site.splashImageUrl ? "summary_large_image" : "summary",
      title: site.title,
      description: site.description ?? undefined,
      ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
    },
  };
}
