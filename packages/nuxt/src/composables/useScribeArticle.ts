import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticle } from "@scribe-atp/core";
import type { Article } from "@scribe-atp/core";

export function useScribeArticle(
  author: string,
  articleSlug: string,
  options?: AsyncDataOptions<Article>
) {
  return useAsyncData<Article>(
    `scribe:article:${author}:${articleSlug}`,
    () => fetchArticle(author, articleSlug),
    options
  );
}
