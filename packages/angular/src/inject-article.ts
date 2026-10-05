import { inject, DestroyRef, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

interface InjectArticleResult {
  article: Signal<Article | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

// Fetches by record key (rkey): current articles have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use injectArticleBySlug when
// you have the slug from a URL.
export function injectArticle(
  author: string,
  rkey: string
): InjectArticleResult {
  const article = signal<Article | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const destroyRef = inject(DestroyRef);
  const controller = new AbortController();

  fetchArticle(author, rkey, controller.signal)
    .then((data) => {
      article.set(data);
      loading.set(false);
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    });

  destroyRef.onDestroy(() => controller.abort());

  return {
    article: article as Signal<Article | null>,
    loading: loading as Signal<boolean>,
    error: error as Signal<Error | null>,
  };
}
