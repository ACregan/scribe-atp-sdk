import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticleBySlug } from "@scribe-atp/core";

export function useScribeDocumentUri(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:document-uri:${author}:${publicationUrl}:${articleSlug}`,
    () => fetchArticleBySlug(author, publicationUrl, articleSlug).then(({ uri }) => uri),
    options
  );
}
