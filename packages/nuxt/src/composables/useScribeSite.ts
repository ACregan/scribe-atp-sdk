import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchSite } from "@scribe-atp/core";
import type { Site } from "@scribe-atp/core";

export function useScribeSite(
  author: string,
  siteSlug: string,
  options?: AsyncDataOptions<Site>
) {
  return useAsyncData<Site>(
    `scribe:site:${author}:${siteSlug}`,
    () => fetchSite(author, siteSlug),
    options
  );
}
