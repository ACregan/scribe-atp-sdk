import { useState, useEffect } from "react";
import { fetchArticle } from "@skyscribe-sdk/core";
import type { Article } from "@skyscribe-sdk/core";

interface UseArticleResult {
  article: Article | null;
  loading: boolean;
  error: Error | null;
}

// Fetches by record key (rkey): current articles have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use useArticleBySlug when
// you have the slug from a URL.
export function useArticle(author: string, rkey: string): UseArticleResult {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setArticle(null);
    setError(null);

    fetchArticle(author, rkey, controller.signal)
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => controller.abort();
  }, [author, rkey]);

  return { article, loading, error };
}
