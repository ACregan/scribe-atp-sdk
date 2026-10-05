import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

// Fetches by record key (rkey): current articles have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use useScribeArticleBySlug when
// you have the slug from a URL.
export function useScribeArticle(
  author: string,
  rkey: string,
  options?: AsyncDataOptions<Article>
) {
  return useAsyncData<Article>(
    `scribe:article:${author}:${rkey}`,
    () => fetchArticle(author, rkey),
    options
  );
}
