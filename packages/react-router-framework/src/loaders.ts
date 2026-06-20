import type { LoaderFunctionArgs } from "react-router";
import { fetchSite, fetchArticle } from "@scribe-atp/core";
import type { Site, Article } from "@scribe-atp/core";

export function createSiteLoader(
  author: string,
  siteSlug: string
): (args: LoaderFunctionArgs) => Promise<Site> {
  return ({ request }) =>
    fetchSite(author, siteSlug, request.signal);
}

export function createArticleLoader(
  author: string,
  articleSlug: string
): (args: LoaderFunctionArgs) => Promise<Article> {
  return ({ request }) =>
    fetchArticle(author, articleSlug, request.signal);
}
