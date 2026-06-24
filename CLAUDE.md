# @scribe-atp/sdk

A monorepo of packages for reading Scribe content from the AT Protocol. Authors write articles in [Scribe CMS](https://scribe-cms.app); this SDK is for developers who want to display that content in their own sites or apps.

## Project documentation

| File | Purpose |
| ---- | ------- |
| `CLAUDE.md` | This file — architecture, patterns, and conventions |
| `DEVELOPER_NOTES.md` | Day-to-day development workflow, changeset process, key commands |
| `UBIQUITOUS_LANGUAGE.md` | Shared vocabulary across the codebase and documentation |

## Packages

| Package | Path | Purpose |
| ------- | ---- | ------- |
| `@scribe-atp/core` | `packages/core` | Pure TS fetch functions, PDS resolution, feed/sitemap generation, types. No framework deps. |
| `@scribe-atp/react` | `packages/react` | React hooks (`useSite`, `useArticle`) wrapping core. |
| `@scribe-atp/react-router-framework` | `packages/react-router-framework` | Loader factories for React Router v7 framework mode. |
| `@scribe-atp/angular` | `packages/angular` | Angular service (`ScribeService`) and injection functions (`injectSite`, `injectArticle`). |
| `@scribe-atp/next` | `packages/next` | Next.js 13+ App Router adapter — `createScribeSite` factory for `generateStaticParams` and `generateMetadata`. |
| `@scribe-atp/vue` | `packages/vue` | Vue 3 composables (`useScribeSite`, `useScribeArticle`). |
| `@scribe-atp/nuxt` | `packages/nuxt` | Nuxt 3 module — wraps vue composables with `useAsyncData` and configures auto-imports. |

All framework adapters are thin wrappers around `@scribe-atp/core`. New adapters should follow the same pattern: framework-idiomatic reactivity on top of the core fetch functions, with `AbortController` cleanup.

## CI/CD

GitLab CI. All jobs must include the runner tag:

```yaml
tags:
  - SERVER-docker-runner
```

Add this to the `default` block in `.gitlab-ci.yml` so it applies to every job automatically.

## Stack

- **TypeScript** — strict mode; ESM + CJS dual output via `tsup`
- **npm workspaces** — monorepo; packages linked locally during development
- **Vitest** — unit tests; `fetch` is mocked at the test level
- **@testing-library/react** — component/hook tests in `packages/react`
- **@vue/test-utils** — component/composable tests in `packages/vue`
- **zone.js + TestBed** — Angular testing in `packages/angular`

Each package has its own `package.json`, `tsconfig.json`, and `tsup.config.ts`. The root `package.json` holds dev tooling only.

## AT Protocol background

Scribe stores content in three collections on the author's Personal Data Server (PDS):

**`app.scribe.site`** — site manifest (rkey = site slug):
```ts
{
  title: string,
  url: string,           // domain name e.g. "norobots.blog"
  urlPrefix: string,     // path prefix e.g. "blog"
  description?: string,
  splashImageUrl?: string,
  logoImageUrl?: string,
  groups: Array<{
    slug: string,
    title: string,
    articles: ArticleRef[],  // cached snapshots — no N+1 fetches needed
  }>,
  ungroupedArticles: ArticleRef[],  // unpublished articles (assigned to site, not yet in a group)
}
```

**`site.standard.document`** — published article (rkey = slug):
```ts
{
  title: string,
  slug: string,          // same as rkey
  path: string,          // full URL path e.g. "/blog/2024/my-first-post"
  site: string,          // canonical site URL
  content: { $type: "app.scribe.content.html", html: string },
  splashImageUrl?: string,
  description?: string,
  tags?: string[],
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
}
```

**`app.scribe.article`** — draft article (rkey = slug), not yet published:
```ts
{
  title: string,
  slug: string,          // same as rkey
  content: { $type: "app.scribe.content.html", html: string },
  splashImageUrl?: string,
  description?: string,
  tags?: string[],
  createdAt: string,
  updatedAt: string,
}
```

**`ArticleRef`** — cached snapshot stored inside a site record:
```ts
{
  uri: string,           // full AT URI e.g. at://did/site.standard.document/slug
  title: string,
  slug?: string,         // article slug / rkey
  splashImageUrl: string | null,
  description?: string | null,
  tags?: string[],
  createdAt: string,
  publishedAt?: string,
  updatedAt?: string,
}
```

AT Protocol repos are **publicly readable without authentication**. No OAuth required for reading.

## PDS resolution — the critical fix

The previous implementation in `scribe-cms.app/app/hooks/` hardcoded `https://public.api.bsky.app` for all XRPC calls. This proxies correctly for `did:plc` accounts on bsky.social but **fails for `did:web` and self-hosted PDS instances**.

The correct flow is:

### Step 1 — resolve handle to DID (if needed)

If `author` is a handle (no `did:` prefix), call `resolveHandle`:
```
GET https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle={handle}
→ { did: "did:plc:..." }
```

Handles can be accepted as a convenience; DIDs are the stable identity.

### Step 2 — resolve DID to PDS endpoint

DID document shape:
```json
{
  "id": "did:plc:...",
  "service": [
    { "id": "#atproto_pds", "type": "AtprotoPersonalDataServer", "serviceEndpoint": "https://bsky.social" }
  ]
}
```

**`did:plc`** — fetch from the PLC directory:
```
GET https://plc.directory/{did}
```

**`did:web`** — construct the well-known URL:
```
GET https://{did-without-did:web:}/.well-known/did.json
```

Find the service entry with `id === "#atproto_pds"` and read `serviceEndpoint`. That is the PDS base URL.

### Step 3 — fetch records from the PDS

Use the resolved PDS URL for all XRPC calls:
```
GET {pdsUrl}/xrpc/com.atproto.repo.getRecord?repo={did}&collection=...&rkey=...
```

### Implementation in `@scribe-atp/core`

```
packages/core/src/
  types.ts          — ArticleRef, SiteGroup, Site, SiteRecord, Article (exported)
  resolve.ts        — resolveIdentifier(), resolvePds() (internal helpers)
  fetch.ts          — fetchSite(), fetchArticle() (exported)
  list.ts           — listSites(), listArticles() (exported) — com.atproto.repo.listRecords with cursor pagination
  utils.ts          — toSlug(), slugFromUri(), flattenArticles() (exported)
  feed.ts           — generateFeed() (exported) — RSS 2.0, hand-rolled XML
  sitemap.ts        — getSitemapEntries() (exported) — returns SitemapEntry[] for merging into framework sitemap generators
  index.ts          — re-exports everything public
```

`resolvePds(did)` should cache results in a `Map` for the lifetime of the module so repeated calls within a single page load don't re-fetch the DID document.

`resolveIdentifier(handleOrDid)` → DID (already correct in the original, just moves here).

`fetchSite(author, siteSlug)` and `fetchArticle(author, articleSlug)` call `resolveIdentifier` then `resolvePds` then the XRPC endpoint. Both functions should be cancellable via `AbortSignal` passed as an optional third argument.

## `@scribe-atp/react` — hooks

```
packages/react/src/
  useSite.ts        — useSite(author, siteSlug) → { site, loading, error }
  useArticle.ts     — useArticle(author, articleSlug) → { article, loading, error }
  index.ts          — re-exports hooks and all types from core
```

Hooks are thin wrappers — all fetch logic lives in `@scribe-atp/core`. Each hook:
- Creates an `AbortController` in `useEffect`
- Passes `controller.signal` to the core fetch function
- Returns `() => controller.abort()` as cleanup
- Sets `{ loading: true }` on mount and on parameter change
- Catches errors into the `error` state

Re-export all types from `@scribe-atp/core` so consumers only need to import one package.

## `@scribe-atp/react-router-framework` — loader factories

```
packages/react-router-framework/src/
  loaders.ts        — createSiteLoader(), createArticleLoader()
  index.ts          — re-exports loaders and all types from core
```

Factories return a loader function compatible with React Router v7 framework mode. Each factory:
- Accepts `author` and `siteSlug`/`articleSlug` at configuration time
- Returns a loader that extracts `request.signal` and passes it to the core fetch function

## `@scribe-atp/angular` — service and injection functions

```
packages/angular/src/
  scribe.service.ts     — ScribeService (@Injectable providedIn: 'root') — Observable API
  inject-site.ts        — injectSite() — Signals API
  inject-article.ts     — injectArticle() — Signals API
  index.ts              — re-exports everything public
```

Ships two APIs. `ScribeService` returns cold Observables; the fetch is cancelled on unsubscribe. `injectSite`/`injectArticle` return readonly signals and abort on `DestroyRef.onDestroy`. Requires `experimentalDecorators: true` and `useDefineForClassFields: false` in tsconfig.

## `@scribe-atp/next` — Next.js App Router adapter

```
packages/next/src/
  create-scribe-site.ts — createScribeSite(author, siteSlug) factory
  index.ts              — re-exports factory and all types from core
```

`createScribeSite` returns an object with six async functions assigned directly to Next.js named exports:
- `generateGroupParams`, `generateArticleParams`, `generateGroupArticleParams` — for `generateStaticParams`
- `generateSiteMetadata`, `generateGroupMetadata`, `generateArticleMetadata` — for `generateMetadata`

Metadata is opinionated (complete OpenGraph by default). Uses `ArticleRef` snapshots from the site record — no per-article fetch at build time. ISR is handled by Next.js route segment config (`export const revalidate`), not by the SDK.

## `@scribe-atp/vue` — Vue 3 composables

```
packages/vue/src/
  useScribeSite.ts    — useScribeSite(author, siteSlug) → { site, loading, error } (Refs)
  useScribeArticle.ts — useScribeArticle(author, articleSlug) → { article, loading, error } (Refs)
  index.ts            — re-exports composables and all types from core
```

Composables use `onUnmounted` for `AbortController` cleanup. Named with `Scribe` prefix (`useScribeSite` not `useSite`) to avoid collision in Nuxt's auto-import context.

## `@scribe-atp/nuxt` — Nuxt 3 module

```
packages/nuxt/src/
  module.ts                        — defineNuxtModule, registers auto-imports
  composables/useScribeSite.ts     — wraps fetchSite with useAsyncData
  composables/useScribeArticle.ts  — wraps fetchArticle with useAsyncData
  index.ts                         — re-exports module and all types from core
```

Full Nuxt module — registered in `nuxt.config.ts` as `modules: ['@scribe-atp/nuxt']`. Auto-imports `useScribeSite` and `useScribeArticle` globally. Returns Nuxt conventions (`data`, `pending`, `error`). Accepts optional `useAsyncData` options as third argument. Calls `fetchSite`/`fetchArticle` from core directly (not the vue composables) to let `useAsyncData` own the SSR lifecycle.

## Relationship to scribe-cms.app

`scribe-cms.app` currently has an `app/hooks/` directory with the original versions of these hooks (without PDS resolution). Once this SDK is published:

- `scribe-cms.app`'s `app/hooks/` directory can be removed
- The CMS's public-read routes can import from `@scribe-atp/core`
- The `ArticleRef` and `SiteGroup` types used throughout the CMS already live in `app/hooks/types.ts` — these become the canonical definitions in `@scribe-atp/core`

During development, use `npm link` or workspace references to test against the CMS before publishing.

## Build setup (per package)

`tsup.config.ts`:
```ts
import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["peer-dep-name"], // list peer deps here
});
```

`package.json` exports map:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

## Testing

Tests live alongside source in each package (`src/fetch.test.ts`, etc.).

**Core tests** — mock `fetch` globally with `vi.stubGlobal("fetch", ...)` and assert the correct URLs are constructed for each DID type. Test the PDS resolution cache (call `resolvePds` twice with the same DID, verify only one fetch).

**React hook tests** — use `@testing-library/react`'s `renderHook`. Mock the core fetch functions with `vi.mock("@scribe-atp/core")` to isolate hook logic from network behaviour.

**Vue composable tests** — use `@vue/test-utils` `mount` with a minimal wrapper component. Mock `@scribe-atp/core` with `vi.mock`. Test: loading state, data on resolve, error on reject, abort on unmount.

**Angular tests** — require `zone.js` and `TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())` in `test-setup.ts`. Use `TestBed.runInInjectionContext()` to test injection functions. `tsconfig.check.json` requires `experimentalDecorators: true` and `useDefineForClassFields: false`.

**Nuxt composable tests** — mock both `@scribe-atp/core` and `#app` with `vi.mock`. The `#app` alias is resolved via a Vitest alias pointing to `packages/nuxt/node_modules/nuxt/dist/app/index.mjs`. Use `(mockUseAsyncData as any).mockImplementation(...)` to avoid fighting nuxt's complex overload types in tests.

## Key commands

```bash
npm install              # install all workspace deps
npm run build            # build all packages (tsup)
npm run test             # run all tests (vitest)
npm run typecheck        # tsc --noEmit across all packages
npm -w packages/core run build   # build a single package
```

## Publishing

Packages publish to npm under `@scribe-atp/`. Versions are independent (each package has its own semver). The CI publish job runs `npx changeset publish` — it detects unpublished versions and publishes them in dependency order automatically.

**Workflow:**
1. Create a changeset: `npx changeset` — select affected packages and bump type
2. Run `npx changeset version` — updates `package.json` versions and `CHANGELOG.md` files
3. Commit the version bump: `chore: version packages — <package>@<version>`
4. Merge to main and trigger the manual publish job in CI

New packages (never published) do not need a changeset — `changeset publish` detects that the version in `package.json` hasn't been published and ships it at the current version.

## Branch protection

`main` is a protected branch. All changes require a feature branch and MR. No direct pushes to main.

## Branding context

- **Scribe ATP** — umbrella project; home for the GitHub org, npm org (`@scribe-atp/*`), SDK docs
- **Scribe CMS** (`scribe-cms.app`) — the authoring tool (separate repo)
- **Scribe SDK** — this repo; the developer toolkit for consuming Scribe content

See `scribe-cms.app`'s CLAUDE.md for the full Scribe CMS architecture, AT Protocol collection schemas, and OAuth patterns.
