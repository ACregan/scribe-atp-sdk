import { inject, DestroyRef, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { fetchSite } from "@scribe-atp/core";
import type { Site } from "@scribe-atp/core";

interface InjectSiteResult {
  site: Signal<Site | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

export function injectSite(author: string, publicationUrl: string): InjectSiteResult {
  const site = signal<Site | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const destroyRef = inject(DestroyRef);
  const controller = new AbortController();

  fetchSite(author, publicationUrl, controller.signal)
    .then((data) => {
      site.set(data);
      loading.set(false);
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    });

  destroyRef.onDestroy(() => controller.abort());

  return {
    site: site as Signal<Site | null>,
    loading: loading as Signal<boolean>,
    error: error as Signal<Error | null>,
  };
}
