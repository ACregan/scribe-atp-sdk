# @scribe-atp/sdk

A monorepo of packages for reading Scribe content from the AT Protocol. Authors write articles in [Scribe CMS](https://scribe-cms.app); this SDK is for developers who want to display that content in their own sites or apps.

## Project documentation

| File | Purpose |
| ---- | ------- |
| `CLAUDE.md` | This file — architecture, patterns, and conventions |
| `PLANNING.md` | Feature specs and implementation notes |

## Packages

| Package | Path | Purpose |
| ------- | ---- | ------- |
| `@scribe-atp/core` | `packages/core` | Pure TS fetch functions, PDS resolution, types. No framework deps. |
| `@scribe-atp/react` | `packages/react` | React hooks (`useSite`, `useArticle`) wrapping core. |

Vue and Angular adapters are planned but not started. When added, follow the same pattern as `@scribe-atp/react` — thin wrappers around the core fetch functions with framework-idiomatic reactivity.

## Stack

- **TypeScript** — strict mode; ESM + CJS dual output via `tsup`
- **npm workspaces** — monorepo; packages linked locally during development
- **Vitest** — unit tests; `fetch` is mocked at the test level
- **@testing-library/react** — component/hook tests in `packages/react`

Each package has its own `package.json`, `tsconfig.json`, and `tsup.config.ts`. The root `package.json` holds dev tooling only.

## AT Protocol background

Scribe stores content in two collections on the author's Personal Data Server (PDS):

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
  ungroupedArticles: ArticleRef[],  // draft / unpublished articles
}
```

**`app.scribe.article`** — article content (rkey = article slug):
```ts
{
  title: string,
  content: string,       // HTML
  url: string,           // same as rkey
  splashImageUrl?: string,
  synopsis?: string,
  createdAt: string,
  updatedAt: string,
}
```

**`ArticleRef`** — cached snapshot stored inside a site record:
```ts
{
  uri: string,           // full AT URI e.g. at://did/app.scribe.article/slug
  title: string,
  url?: string,          // article slug
  splashImageUrl: string | null,
  synopsis?: string | null,
  createdAt: string,
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
  types.ts          — ArticleRef, SiteGroup, Site, Article (exported)
  resolve.ts        — resolveIdentifier(), resolvePds() (internal helpers)
  fetch.ts          — fetchSite(), fetchArticle() (exported)
  utils.ts          — toSlug(), slugFromUri(), flattenArticles() (exported)
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
});
```

`package.json` exports map:
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

## Testing

Tests live alongside source in each package (`src/fetch.test.ts`, etc.).

**Core tests** — mock `fetch` globally with `vi.stubGlobal("fetch", ...)` and assert the correct URLs are constructed for each DID type. Test the PDS resolution cache (call `resolvePds` twice with the same DID, verify only one fetch).

**React hook tests** — use `@testing-library/react`'s `renderHook`. Mock the core fetch functions with `vi.mock("@scribe-atp/core")` to isolate hook logic from network behaviour. Test: loading state on mount, data set on resolve, error state on reject, cleanup/abort on unmount, re-fetch on param change.

## Key commands

```bash
npm install              # install all workspace deps
npm run build            # build all packages (tsup)
npm run test             # run all tests (vitest)
npm run typecheck        # tsc --noEmit across all packages
npm -w packages/core run build   # build a single package
```

## Publishing

Packages publish to npm under `@scribe-atp/`. Version independently (each package has its own semver). Publish `core` before `react` since `react` depends on it.

**Do not publish** until the PDS resolution fix is complete and tested — the hardcoded `public.api.bsky.app` approach must not be carried into the published packages.

## Branding context

- **Scribe ATP** — umbrella project; home for the GitHub org, npm org (`@scribe-atp/*`), SDK docs
- **Scribe CMS** (`scribe-cms.app`) — the authoring tool (separate repo)
- **Scribe SDK** — this repo; the developer toolkit for consuming Scribe content

See `scribe-cms.app`'s CLAUDE.md for the full Scribe CMS architecture, AT Protocol collection schemas, and OAuth patterns.
