import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticleBySlug } from "@scribe-atp/core";

export function useScribeDocumentUri(
  author: string,
  siteSlug: string,
  articleSlug: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:document-uri:${author}:${siteSlug}:${articleSlug}`,
    () => fetchArticleBySlug(author, siteSlug, articleSlug).then(({ uri }) => uri),
    options
  );
}
