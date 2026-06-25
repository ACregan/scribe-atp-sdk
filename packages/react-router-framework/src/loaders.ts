import type { LoaderFunctionArgs } from "react-router";
import { fetchSite, fetchArticle, resolvePublicationUri, resolveDocumentUri } from "@scribe-atp/core";
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

export interface ArticleWithUri extends Article {
  documentUri: string;
}

export function createArticleRouteLoader(
  author: string,
  slugParam = "articleSlug"
): (args: LoaderFunctionArgs) => Promise<ArticleWithUri> {
  return async ({ request, params }) => {
    const articleSlug = params[slugParam];
    if (!articleSlug) throw new Error(`Missing route param: ${slugParam}`);
    const [article, documentUri] = await Promise.all([
      fetchArticle(author, articleSlug, request.signal),
      resolveDocumentUri(author, articleSlug, request.signal),
    ]);
    return { ...article, documentUri };
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
