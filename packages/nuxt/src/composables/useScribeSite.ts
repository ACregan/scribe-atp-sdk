import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchSite } from "@skyscribe-sdk/core";
import type { Site } from "@skyscribe-sdk/core";

export function useScribeSite(
  author: string,
  publicationUrl: string,
  options?: AsyncDataOptions<Site>
) {
  return useAsyncData<Site>(
    `scribe:site:${author}:${publicationUrl}`,
    () => fetchSite(author, publicationUrl),
    options
  );
}
