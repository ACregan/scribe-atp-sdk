import type { Metadata } from "next";
import type { Article, Site } from "@scribe-atp/core";
import {
  buildCanonicalUrl,
  buildSiteUrl,
  generateArticleJsonLd,
  generateSiteJsonLd,
} from "@scribe-atp/core";

// Re-exported so consumers can render structured data themselves — Next's
// Metadata object has no field for a raw <script> tag, so the convention is
// for the page component to render
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
// using these.
export { generateArticleJsonLd, generateSiteJsonLd };

export function articleMetadata(article: Article, site: Site): Metadata {
  const canonicalUrl = buildCanonicalUrl(article, site);
  return {
    title: `${article.title} — ${site.title}`,
    description: article.description ?? undefined,
    alternates: { canonical: canonicalUrl },
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
  const siteUrl = buildSiteUrl(site);
  return {
    title: site.title,
    description: site.description ?? undefined,
    alternates: { canonical: siteUrl },
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
