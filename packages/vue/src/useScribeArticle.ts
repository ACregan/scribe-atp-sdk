import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

export interface UseScribeArticleResult {
  article: Ref<Article | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

// Fetches by record key (rkey): current articles have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use useScribeArticleBySlug when
// you have the slug from a URL.
export function useScribeArticle(
  author: string,
  rkey: string
): UseScribeArticleResult {
  const article = ref<Article | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchArticle(author, rkey, controller.signal)
    .then((data) => {
      article.value = data;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { article, loading, error };
}
