import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { fetchSite, fetchArticle, resolvePublicationUri, resolveDocumentUri } from "@scribe-atp/core";
import type { Site, Article } from "@scribe-atp/core";

@Injectable({ providedIn: "root" })
export class ScribeService {
  getSite(author: string, siteSlug: string): Observable<Site> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      fetchSite(author, siteSlug, controller.signal)
        .then((site) => {
          subscriber.next(site);
          subscriber.complete();
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          subscriber.error(err);
        });
      return () => controller.abort();
    });
  }

  getArticle(author: string, articleSlug: string): Observable<Article> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      fetchArticle(author, articleSlug, controller.signal)
        .then((article) => {
          subscriber.next(article);
          subscriber.complete();
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          subscriber.error(err);
        });
      return () => controller.abort();
    });
  }

  getPublicationUri(author: string, siteSlug: string): Observable<string> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      resolvePublicationUri(author, siteSlug, controller.signal)
        .then((uri) => {
          subscriber.next(uri);
          subscriber.complete();
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          subscriber.error(err);
        });
      return () => controller.abort();
    });
  }

  getDocumentUri(author: string, articleSlug: string): Observable<string> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      resolveDocumentUri(author, articleSlug, controller.signal)
        .then((uri) => {
          subscriber.next(uri);
          subscriber.complete();
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          subscriber.error(err);
        });
      return () => controller.abort();
    });
  }
}
