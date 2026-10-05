# ADR 0003 — Migrate to the SkyScribe SDK (`@skyscribe-sdk/*`, sdk.skyscribe.app)

**Status:** Accepted
**Date:** 2026-10-05

Scribe ATP is being folded into SkyScribe. This SDK is the first part to move. Its name is now the **SkyScribe SDK**, its packages publish as `@skyscribe-sdk/*`, and its docs move from `docs.scribe-atp.app` (Astro + Starlight in the `scribe-atp-docs` repo) to a new React Router app at `sdk.skyscribe.app`, kept in this repo. The SDK docs are for developers building an **SDK-driven website**. Author how-tos live in skyscribe.app's User Guide (skyscribe-app ADR 0076). These decisions came out of one grill session on 2026-10-05.

## Packages

- **Rename every package from `@scribe-atp/<pkg>` to `@skyscribe-sdk/<pkg>`**, keeping the package part (`core`, `react`, `react-router-framework`, …). npm can't rename a package, so this is a new publish under new names.
- **The scope is `@skyscribe-sdk`, not `@skyscribe`.** `@skyscribe` was the first choice, but it's taken: `skyscribe` is an unrelated, active npm *user* account, and npm usernames and org names share one namespace. `@skyscribe-sdk` matches the product name word for word and is only for the SDK. Rejected alternatives: `@skyscribeapp` (reads like the app) and `@skyscribehq` (says nothing about the contents).
- **Version numbers continue, with a patch bump for the migration** (e.g. core 3.11.1 → `@skyscribe-sdk/core` 3.11.2), so changelogs and semver history carry on unbroken.
- **API identifiers don't change:** `ScribeService`, `useScribeSite`, `injectSite`, the record's `scribe` extension object, `app.scribe.content.html`. Renaming them would be a breaking change, and the last two are data stored in authors' PDS repos, not branding. Only import paths change for consumers.
- **`@skyscribe-sdk/social` keeps calling `social.scribe-atp.app`.** Moving the Social service is a separate task.

## Docs app

- **Lives in this repo as `apps/docs`, a `private: true` workspace** that changesets never publishes. An API change and its docs land in one MR. The cost is that this repo's CI and Renovate also cover a React Router app. Rejected alternative: a separate docs repo, which is the split that let docs drift from the API before.
- **React Router, fully prerendered at build time**, served as static files by a Cloudflare Worker on the `sdk.skyscribe.app` custom domain (`skyscribe.app` is already a Cloudflare zone). Docs content only changes on deploy, so nothing needs rendering on request. A route can opt into server rendering later if it ever needs to. The app is React Router rather than Astro because Astro restricted the old docs site on occasion.
- **Looks like skyscribe.app: the visual pieces are copied, not shared.** Design tokens, colours, typography and fonts, plus trimmed copies of the header, side menu, footer, Omnibar, theme toggle and SVG icons are copied into `apps/docs`, each noting its source in skyscribe-app. skyscribe-app's `CoreLayout` is tied to login sessions and subscriptions, and extracting a shared `@skyscribe-sdk/ui` package would mean a large refactor plus app UI published under the SDK's npm org. If a third app needs the same shell, that's the point to revisit.
- **Search is Omnibar-style:** a search bar where skyscribe.app has its Omnibar, using its ranked substring matcher (skyscribe-app ADR 0042) over a JSON index built at build time. The index holds each page's title, h2/h3 headings (linking to the anchor) and the API names in its code. It adds no dependency and keeps the strict CSP. Rejected alternative: Pagefind full-text search, which needs `'wasm-unsafe-eval'` and a custom UI anyway. If full text is ever needed, add a short text excerpt per section to the index.
- **Covers the latest version only.** Pages for newer APIs say "since vX.Y".
- **No analytics.** skyscribe.app's privacy policy promises none, and the footer links to it (`skyscribe.app/privacy`, which covers this subdomain too) instead of the site having its own policy. The old docs site used Umami.

## URLs

`/`, `/concepts`, `/quickstart`, `/frameworks/<framework>`, `/api/<package>` (the exact package name, e.g. `/api/react-router-framework`), `/guides/<topic>`, `/migrating`. There's no `/docs` prefix, because the whole subdomain is docs. These URLs are permanent, since two older URL schemes redirect into them:

- **`docs.scribe-atp.app/developers/...`** → the same page here. `/developers/core-concepts` → `/concepts`, `framework-guides/*` → `/frameworks/*`, `api-reference/*` → `/api/*`, `guides/*` → `/guides/*`. `/` and `/developers` → `/`, `/privacy` → `skyscribe.app/privacy`, and `/authors/*` → the matching skyscribe.app User Guide page. These are permanent 301s from an nginx `map` on the VPS, which keeps serving `scribe-atp.app` anyway. `scribe-atp.app`'s DNS isn't on Cloudflare, and moving the zone just for a redirect isn't worth the risk. Anything not in the map goes to `/`.
- **`skyscribe.app/users-guide/build-your-own-frontend/...`** and `/users-guide/reference/data-model` → the same page here, as route-level redirects in skyscribe-app (ADR 0076 there).

## Content

- **Starts from skyscribe-app's `app/user-guide/content/build-your-own-frontend/` copy**, not `scribe-atp-docs`. That copy is the old docs mechanically converted (components, links, "Scribe CMS" → "SkyScribe"), and the old docs have no newer content. The conversion left mistakes (e.g. "The the SDK"), so the port is a real edit, not another find-and-replace. skyscribe-app's `reference/data-model` page merges into `/concepts`.
- **Anything the author does in skyscribe.app gets a brief description and a link** to the more authoritative doc (usually the User Guide). These docs describe what the record contains, not skyscribe.app's screens. Every such claim is checked against skyscribe-app's code during the port. For example, the old text told authors to "set `article.canonicalUrl`", but skyscribe.app computes it from the Publication's domain and the Document's path. Claims that aren't true are rewritten or removed. Where the User Guide has nothing to link to, that's logged as a gap in the User Guide.
- **The homepage has one line for authors who arrive by mistake:** "Not a developer? You probably want a SkyScribe Site →".

## Release and sunset order

1. Publish `@skyscribe-sdk/*` (the rename on its own branch and MR).
2. Build and launch `sdk.skyscribe.app`, including `/migrating`: the package name table, install commands, and a note that only import paths change.
3. Publish one last README-only patch of each `@scribe-atp/*` package pointing to its new name (npm package pages only update on publish). Then `npm deprecate` every old package with `"Renamed to @skyscribe-sdk/<pkg> — see https://sdk.skyscribe.app/migrating"`. Deprecation waits until step 2 so it never points at a page that doesn't exist yet.
4. Turn on the `docs.scribe-atp.app` redirects. Its smoke test checks for a 301 to the matching sdk.skyscribe.app page instead of page content.
5. Migrate the SDK-driven websites `norobots`, `perpetual-summer-ltd` and `anthonycregan.co.uk-2025`, one MR each. These double as a test of `/migrating`.

**Consumers that don't migrate now:** Scribe CMS (`scribe-atp.app`) stays on `@scribe-atp/*` until it's retired. The deprecated packages keep working, and it isn't worth migrating an app that's being switched off. Scribe Reader switches to `@skyscribe-sdk/*` as part of its separate integration into SkyScribe.

## CI

- **Packages publish through npm staged publishing, not a 2FA-bypass token.** npm is phasing out 2FA-bypass granular tokens: no account, package or org management from August 2026, and no publishing at all from around January 2027. Trusted publishing (OIDC) doesn't support self-hosted GitLab. So `NPM_TOKEN` is now a **stage-only** granular token on `@skyscribe-sdk` and `@scribe-atp`, with no 2FA bypass. Even if it leaked, it couldn't put anything live. The manual `publish` job runs a script instead of `changeset publish`, because a stage-only token is refused for `npm publish` and `npm stage` doesn't handle workspaces. For each package whose `package.json` version isn't on npm yet, the script (`scripts/stage-publish.sh`) runs `npm stage publish --access public` in that package's folder. A maintainer then approves each stage locally with 2FA: `npm login`, `npm stage list`, `npm stage approve <id> --otp=…` (npm CLI 11.15+). Rejected alternative: publishing from a maintainer's machine with `changeset publish --otp`. It needs no token, but releases would be built from a local working copy instead of a clean CI checkout. Granular write tokens last at most 90 days, so the token has to be renewed (the current one expires 2027-01-03).
- **MR pipelines** build the docs and run the internal link check (blocking) and external link check (advisory), carried over from `scribe-atp-docs`.
- **Docs go live through a manual `deploy:docs` job on `main`** (`wrangler deploy`, using a `CLOUDFLARE_API_TOKEN` CI variable, the same pattern as skyscribe-site), and only when `apps/docs/**` changed. It sits next to the manual publish job, so docs never describe an API that isn't on npm yet.

## Out of scope (separate, required tasks)

- Integrating Scribe Reader into SkyScribe. `reader.scribe-atp.app` URLs are written into draft Documents' `site` field, so that domain has to keep resolving or redirecting permanently.
- Moving the Social service (`social.scribe-atp.app`, its OAuth client ID).
- Retiring Scribe CMS, and redirecting `scribe-atp.app` and `scribe-cms.app`. Moving the `scribe-atp.app` zone to Cloudflare could be reconsidered at that point.
- Renaming this repo on GitLab (and the GitHub mirror).
