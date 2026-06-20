import { useState, useEffect } from "react";
import { fetchArticle } from "@scribe-atp/core";
import type { Article } from "@scribe-atp/core";

interface UseArticleResult {
  article: Article | null;
  loading: boolean;
  error: Error | null;
}

export function useArticle(author: string, articleSlug: string): UseArticleResult {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setArticle(null);
    setError(null);

    fetchArticle(author, articleSlug, controller.signal)
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
  }, [author, articleSlug]);

  return { article, loading, error };
}
