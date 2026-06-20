# @scribe-atp/angular

[![npm](https://img.shields.io/npm/v/@scribe-atp/angular)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)

Angular service and injection functions for reading [Scribe CMS](https://scribe-cms.app) content from the AT Protocol. Requires Angular 16 or later.

Wraps [`@scribe-atp/core`](https://www.npmjs.com/package/@scribe-atp/core) with idiomatic Angular reactivity. Ships two APIs — pick whichever fits your component style.

## Installation

```bash
npm install @scribe-atp/angular
```

## Observable API — `ScribeService`

`ScribeService` is provided in the root injector (`providedIn: 'root'`) and returns cold Observables. The underlying fetch is cancelled automatically when you unsubscribe.

Compose with the `async` pipe for the most concise result:

```ts
import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf, NgFor } from "@angular/common";
import { ScribeService } from "@scribe-atp/angular";

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
  site$ = inject(ScribeService).getSite("alice.bsky.social", "alice-bsky-social");
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
    this.sub = this.scribe.getSite("alice.bsky.social", "alice-bsky-social").subscribe({
      next:  (site) => { this.site = site; this.loading = false; },
      error: (err)  => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

`getArticle` follows the same pattern:

```ts
article$ = inject(ScribeService).getArticle("alice.bsky.social", "my-first-post");
```

## Signals API — `injectSite` / `injectArticle`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component is destroyed.

```ts
import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { injectArticle } from "@scribe-atp/angular";

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
  vm = injectArticle("alice.bsky.social", "my-first-post");
}
```

`injectSite` returns `{ site, loading, error }` as readonly signals:

```ts
vm = injectSite("alice.bsky.social", "alice-bsky-social");
// vm.site(), vm.loading(), vm.error()
```

> **Note:** Injection functions must be called in an injection context — inside a constructor or class field initialiser. They cannot be called inside lifecycle hooks or event handlers.

## TypeScript types

All types from `@scribe-atp/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@scribe-atp/angular";
```

## License

[MIT](https://github.com/ACregan/scribe-atp-sdk/blob/main/LICENSE)
