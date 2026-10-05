# @skyscribe-sdk/angular

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/angular)](https://www.npmjs.com/package/@skyscribe-sdk/angular)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Angular service and injection functions for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Angular 16 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with idiomatic Angular reactivity. Ships two APIs — pick whichever fits your component style.

## Installation

```bash
npm install @skyscribe-sdk/angular
```

## Observable API — `ScribeService`

`ScribeService` is provided in the root injector (`providedIn: 'root'`) and returns cold Observables. The underlying fetch is cancelled automatically when you unsubscribe.

Compose with the `async` pipe for the most concise result:

```ts
import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf, NgFor } from "@angular/common";
import { ScribeService } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor],
  template: `
    <ng-container *ngIf="site$ | async as site">
      <h1>{{ site.title }}</h1>
      <ul>
        <li *ngFor="let group of site.groups">{{ group.title }}</li>
      </ul>
    </ng-container>
  `,
})
export class BlogComponent {
  site$ = inject(ScribeService).getSite("alice.bsky.social", "https://alice.bsky.social");
}
```

For explicit subscription management:

```ts
export class BlogComponent implements OnInit, OnDestroy {
  site: Site | null = null;
  loading = true;
  error: Error | null = null;

  private sub: Subscription | undefined;

  constructor(private scribe: ScribeService) {}

  ngOnInit() {
    this.sub = this.scribe.getSite("alice.bsky.social", "https://alice.bsky.social").subscribe({
      next:  (site) => { this.site = site; this.loading = false; },
      error: (err)  => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

`getArticleBySlug` follows the same pattern, emitting `{ article, uri }`:

```ts
result$ = inject(ScribeService).getArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
```

`getArticle(author, rkey)` and `injectArticle(author, rkey)` fetch by record key instead, for when you already have an `ArticleRef`. Don't pass them a slug.

## Signals API — `injectSite` / `injectArticleBySlug`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component is destroyed.

```ts
import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { injectArticleBySlug } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [NgIf],
  template: `
    <p *ngIf="vm.loading()">Loading…</p>
    <p *ngIf="vm.error()">{{ vm.error()!.message }}</p>
    <article *ngIf="vm.article() as article">
      <h1>{{ article.title }}</h1>
      <div [innerHTML]="article.content"></div>
    </article>
  `,
})
export class ArticleComponent {
  vm = injectArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
}
```

`injectSite` returns `{ site, loading, error }` as readonly signals:

```ts
vm = injectSite("alice.bsky.social", "https://alice.bsky.social");
// vm.site(), vm.loading(), vm.error()
```

> **Note:** Injection functions must be called in an injection context — inside a constructor or class field initialiser. They cannot be called inside lifecycle hooks or event handlers.

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/angular";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
