import type { LoaderFunctionArgs } from "react-router";
import { fetchSite, fetchArticleBySlug, resolvePublicationUri } from "@scribe-atp/core";
import type { Site, Article } from "@scribe-atp/core";

export function createSiteLoader(
  author: string,
  publicationUrl: string,
  deps?: { fetchSite?: typeof fetchSite }
): (args: LoaderFunctionArgs) => Promise<Site> {
  const _fetchSite = deps?.fetchSite ?? fetchSite;
  return ({ request }) => _fetchSite(author, publicationUrl, request.signal);
}

export interface ArticleWithUri extends Article {
  documentUri: string;
}

export function createArticleRouteLoader(
  author: string,
  publicationUrl: string,
  slugParam?: string,
  deps?: { fetchArticleBySlug?: typeof fetchArticleBySlug }
): (args: LoaderFunctionArgs) => Promise<ArticleWithUri> {
  const _slugParam = slugParam ?? "articleSlug";
  const _fetchArticleBySlug = deps?.fetchArticleBySlug ?? fetchArticleBySlug;
  return async ({ request, params }) => {
    const articleSlug = params[_slugParam];
    if (!articleSlug) throw new Error(`Missing route param: ${_slugParam}`);
    const { article, uri } = await _fetchArticleBySlug(author, publicationUrl, articleSlug, request.signal);
    return { ...article, documentUri: uri };
  };
}

export function createWellKnownLoader(
  author: string,
  publicationUrl: string,
  deps?: { resolvePublicationUri?: typeof resolvePublicationUri }
): (args: LoaderFunctionArgs) => Promise<Response> {
  const _resolvePublicationUri = deps?.resolvePublicationUri ?? resolvePublicationUri;
  return async ({ request }) => {
    const uri = await _resolvePublicationUri(author, publicationUrl, request.signal);
    return new Response(uri, { headers: { "Content-Type": "text/plain" } });
  };
}
