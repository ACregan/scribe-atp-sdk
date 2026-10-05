import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

export interface UseScribeArticleBySlugResult {
  article: Ref<Article | null>;
  /** The article's AT URI. */
  uri: Ref<string | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

// Looks the article up by its human-readable slug (as in its URL) in the
// Site at `publicationUrl`. useScribeArticle takes the record key instead.
export function useScribeArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): UseScribeArticleBySlugResult {
  const article = ref<Article | null>(null);
  const uri = ref<string | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchArticleBySlug(author, publicationUrl, articleSlug, controller.signal)
    .then((result) => {
      article.value = result.article;
      uri.value = result.uri;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { article, uri, loading, error };
}
