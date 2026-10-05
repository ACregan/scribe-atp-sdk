import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import type { ArticleResult } from "@skyscribe-sdk/core";

// Looks the article up by its human-readable slug (as in its URL) in the
// Site at `publicationUrl`. `data` holds `{ article, uri }`.
// useScribeArticle takes the record key instead.
export function useScribeArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  options?: AsyncDataOptions<ArticleResult>
) {
  return useAsyncData<ArticleResult>(
    `scribe:article-by-slug:${author}:${publicationUrl}:${articleSlug}`,
    () => fetchArticleBySlug(author, publicationUrl, articleSlug),
    options
  );
}
