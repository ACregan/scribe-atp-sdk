import { fetchSite } from "@scribe-atp/core";
import type { Metadata } from "next";

export function createScribeSite(author: string, siteSlug: string) {
  return {
    generateGroupParams: async (): Promise<{ groupSlug: string }[]> => {
      const site = await fetchSite(author, siteSlug);
      return site.groups.map((g) => ({ groupSlug: g.slug }));
    },

    generateArticleParams: async (): Promise<{ articleSlug: string }[]> => {
      const site = await fetchSite(author, siteSlug);
      return site.groups
        .flatMap((g) => g.articles)
        .filter((a) => !!a.slug)
        .map((a) => ({ articleSlug: a.slug! }));
    },

    generateGroupArticleParams: async (): Promise<
      { groupSlug: string; articleSlug: string }[]
    > => {
      const site = await fetchSite(author, siteSlug);
      return site.groups.flatMap((g) =>
        g.articles
          .filter((a) => !!a.slug)
          .map((a) => ({ groupSlug: g.slug, articleSlug: a.slug! }))
      );
    },

    generateSiteMetadata: async (): Promise<Metadata> => {
      const site = await fetchSite(author, siteSlug);
      return {
        title: site.title,
        description: site.description ?? undefined,
        openGraph: {
          title: site.title,
          description: site.description ?? undefined,
          ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
        },
      };
    },

    generateGroupMetadata: async (groupSlug: string): Promise<Metadata> => {
      const site = await fetchSite(author, siteSlug);
      const group = site.groups.find((g) => g.slug === groupSlug);
      const title = group ? `${group.title} — ${site.title}` : site.title;
      return {
        title,
        openGraph: { title },
      };
    },

    generateArticleMetadata: async (articleSlug: string): Promise<Metadata> => {
      const site = await fetchSite(author, siteSlug);
      const article = site.groups
        .flatMap((g) => g.articles)
        .find((a) => a.slug === articleSlug);
      const title = article
        ? `${article.title} — ${site.title}`
        : site.title;
      return {
        title,
        description: article?.description ?? undefined,
        openGraph: {
          title,
          description: article?.description ?? undefined,
          ...(article?.splashImageUrl
            ? { images: [article.splashImageUrl] }
            : {}),
        },
      };
    },
  };
}
