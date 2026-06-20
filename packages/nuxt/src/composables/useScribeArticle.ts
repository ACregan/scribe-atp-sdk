import { useAsyncData } from "#app";
import { fetchArticle } from "@scribe-atp/core";
import type { Article } from "@scribe-atp/core";

export function useScribeArticle(
  author: string,
  articleSlug: string,
  options?: Parameters<typeof useAsyncData>[2]
) {
  return useAsyncData<Article>(
    `scribe:article:${author}:${articleSlug}`,
    () => fetchArticle(author, articleSlug),
    options
  );
}
