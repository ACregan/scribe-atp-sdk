import type { LoaderFunctionArgs } from "react-router";
import { fetchSite, fetchArticleBySlug, resolvePublicationUri } from "@scribe-atp/core";
import type { Site, Article } from "@scribe-atp/core";

export function createSiteLoader(
  author: string,
  siteSlug: string
): (args: LoaderFunctionArgs) => Promise<Site> {
  return ({ request }) =>
    fetchSite(author, siteSlug, request.signal);
}

export interface ArticleWithUri extends Article {
  documentUri: string;
}

export function createArticleRouteLoader(
  author: string,
  siteSlug: string,
  slugParam = "articleSlug"
): (args: LoaderFunctionArgs) => Promise<ArticleWithUri> {
  return async ({ request, params }) => {
    const articleSlug = params[slugParam];
    if (!articleSlug) throw new Error(`Missing route param: ${slugParam}`);
    const { article, uri } = await fetchArticleBySlug(author, siteSlug, articleSlug, request.signal);
    return { ...article, documentUri: uri };
  };
}

export function createWellKnownLoader(
  author: string,
  siteSlug: string
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async ({ request }) => {
    const uri = await resolvePublicationUri(author, siteSlug, request.signal);
    return new Response(uri, { headers: { "Content-Type": "text/plain" } });
  };
}
