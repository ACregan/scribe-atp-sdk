import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchSite } from "@scribe-atp/core";
import type { Site } from "@scribe-atp/core";

export interface UseScribeSiteResult {
  site: Ref<Site | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useScribeSite(
  author: string,
  siteSlug: string
): UseScribeSiteResult {
  const site = ref<Site | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchSite(author, siteSlug, controller.signal)
    .then((data) => {
      site.value = data;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { site, loading, error };
}
