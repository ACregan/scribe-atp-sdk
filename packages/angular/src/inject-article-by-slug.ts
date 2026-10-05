import { inject, DestroyRef, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

interface InjectArticleBySlugResult {
  article: Signal<Article | null>;
  /** The article's AT URI. */
  uri: Signal<string | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

// Looks the article up by its human-readable slug (as in its URL) in the
// Site at `publicationUrl`. injectArticle takes the record key instead.
export function injectArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): InjectArticleBySlugResult {
  const article = signal<Article | null>(null);
  const uri = signal<string | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const destroyRef = inject(DestroyRef);
  const controller = new AbortController();

  fetchArticleBySlug(author, publicationUrl, articleSlug, controller.signal)
    .then((result) => {
      article.set(result.article);
      uri.set(result.uri);
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
    uri: uri as Signal<string | null>,
    loading: loading as Signal<boolean>,
    error: error as Signal<Error | null>,
  };
}
