import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { resolvePublicationUri } from "@scribe-atp/core";

export interface UseScribePublicationUriResult {
  uri: Ref<string | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useScribePublicationUri(
  author: string,
  siteSlug: string
): UseScribePublicationUriResult {
  const uri = ref<string | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  resolvePublicationUri(author, siteSlug, controller.signal)
    .then((data) => {
      uri.value = data;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { uri, loading, error };
}
