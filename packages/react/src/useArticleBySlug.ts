import { useState, useEffect } from "react";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

export interface UseArticleBySlugResult {
  article: Article | null;
  /** The article's AT URI, for @skyscribe-sdk/social's buttons. */
  uri: string | null;
  loading: boolean;
  error: Error | null;
}

// Looks the article up by its human-readable slug (as in its URL) in the
// Site at `publicationUrl`. useArticle takes the record key instead.
export function useArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): UseArticleBySlugResult {
  const [article, setArticle] = useState<Article | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setArticle(null);
    setUri(null);
    setError(null);

    fetchArticleBySlug(author, publicationUrl, articleSlug, controller.signal)
      .then((result) => {
        setArticle(result.article);
        setUri(result.uri);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => controller.abort();
  }, [author, publicationUrl, articleSlug]);

  return { article, uri, loading, error };
}
