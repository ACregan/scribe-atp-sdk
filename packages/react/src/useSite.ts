import { useState, useEffect } from "react";
import { fetchSite } from "@scribe-atp/core";
import type { Site } from "@scribe-atp/core";

interface UseSiteResult {
  site: Site | null;
  loading: boolean;
  error: Error | null;
}

export function useSite(author: string, publicationUrl: string): UseSiteResult {
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSite(null);
    setError(null);

    fetchSite(author, publicationUrl, controller.signal)
      .then((data) => {
        setSite(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => controller.abort();
  }, [author, publicationUrl]);

  return { site, loading, error };
}
