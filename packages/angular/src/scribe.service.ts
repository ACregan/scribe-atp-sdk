import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { fetchSite, fetchArticle, fetchArticleBySlug, resolvePublicationUri } from "@scribe-atp/core";
import type { Site, Article } from "@scribe-atp/core";

@Injectable({ providedIn: "root" })
export class ScribeService {
  getSite(author: string, publicationUrl: string): Observable<Site> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      fetchSite(author, publicationUrl, controller.signal)
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

  getPublicationUri(author: string, publicationUrl: string): Observable<string> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      resolvePublicationUri(author, publicationUrl, controller.signal)
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

  getDocumentUri(author: string, publicationUrl: string, articleSlug: string): Observable<string> {
    return new Observable((subscriber) => {
      const controller = new AbortController();
      fetchArticleBySlug(author, publicationUrl, articleSlug, controller.signal)
        .then(({ uri }) => {
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
