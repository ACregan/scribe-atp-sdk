import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { resolvePublicationUri } from "@scribe-atp/core";

export function useScribePublicationUri(
  author: string,
  siteSlug: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:publication-uri:${author}:${siteSlug}`,
    () => resolvePublicationUri(author, siteSlug),
    options
  );
}
