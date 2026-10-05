import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { resolvePublicationUri } from "@skyscribe-sdk/core";

export function useScribePublicationUri(
  author: string,
  publicationUrl: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:publication-uri:${author}:${publicationUrl}`,
    () => resolvePublicationUri(author, publicationUrl),
    options
  );
}
