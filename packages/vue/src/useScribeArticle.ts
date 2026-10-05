import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

export interface UseScribeArticleResult {
  article: Ref<Article | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useScribeArticle(
  author: string,
  articleSlug: string
): UseScribeArticleResult {
  const article = ref<Article | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchArticle(author, articleSlug, controller.signal)
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
