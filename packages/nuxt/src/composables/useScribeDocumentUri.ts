import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { resolveDocumentUri } from "@scribe-atp/core";

export function useScribeDocumentUri(
  author: string,
  articleSlug: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:document-uri:${author}:${articleSlug}`,
    () => resolveDocumentUri(author, articleSlug),
    options
  );
}
