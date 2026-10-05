import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

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
