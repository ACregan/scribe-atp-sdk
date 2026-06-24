# Ubiquitous Language — Scribe ATP SDK

This document defines the shared vocabulary used across the SDK codebase,
documentation, and conversations. When a term appears in code, tests, or
discussion, it should match the definition here.

---

## Project & Brand

**Scribe CMS** (`scribe-cms.app`)
: The authoring tool where writers create and publish their content.
  Separate repo; not part of this SDK.

**Scribe ATP SDK** (this repo)
: The developer toolkit for consuming Scribe content in third-party apps
  and sites. Published to npm under the `@scribe-atp/` scope.

**`@scribe-atp/core`**
: The framework-agnostic package. Pure TypeScript fetch functions, PDS
  resolution logic, and shared types. No runtime dependencies.

**`@scribe-atp/react`**
: The React adapter. Thin hooks wrapping `@scribe-atp/core` with
  idiomatic React state management and cleanup.

**`@scribe-atp/react-router-framework`**
: Loader factories for React Router v7 framework mode. Wraps core fetch
  functions in the loader/signal conventions of React Router's server-side
  data loading model.

**`@scribe-atp/angular`**
: The Angular adapter. Provides `ScribeService` (Observable API) and
  `injectSite` / `injectArticle` (Signals API) wrapping `@scribe-atp/core`
  with idiomatic Angular reactivity and cleanup.

---

## AT Protocol Concepts

**AT Protocol (ATP)**
: The open social networking protocol on which Scribe is built. Defines
  how identity, data storage, and record fetching work.

**DID (Decentralized Identifier)**
: A stable, globally unique identifier for an author (e.g.
  `did:plc:abc123`). Handles are human-readable aliases; DIDs are the
  canonical identity that never changes.

**`did:plc`**
: A DID managed by the PLC directory (`plc.directory`). The most common
  type for accounts on bsky.social.

**`did:web`**
: A DID derived from a domain name. The DID document is fetched from
  `https://{domain}/.well-known/did.json`. Used by self-hosted instances.

**Handle**
: A human-readable username (e.g. `alice.bsky.social`). Must be resolved
  to a DID before any data can be fetched. Not stable — authors can change
  their handle; DIDs cannot change.

**PDS (Personal Data Server)**
: The server that hosts an author's AT Protocol repository. All Scribe
  content records are stored on and served from the author's PDS. May be
  self-hosted or a shared provider (e.g. bsky.social).

**PDS resolution**
: The process of discovering the correct PDS URL for a given DID.
  Involves fetching the DID document and reading the `#atproto_pds` service
  endpoint. See `packages/core/src/resolve.ts`.

**DID document**
: A JSON document that maps a DID to its service endpoints. The relevant
  field is the service entry with `id === "#atproto_pds"`.

**XRPC**
: The HTTP-based RPC protocol used by AT Protocol. Calls take the form
  `GET {pdsUrl}/xrpc/{method}?{params}`.

**AT URI**
: A URI that fully addresses a record in the AT Protocol network.
  Format: `at://{did}/{collection}/{rkey}`.
  Example: `at://did:plc:abc123/app.scribe.article/my-post`.

**rkey (Record Key)**
: The unique key for a record within a collection on a PDS. For Scribe,
  the rkey is typically the slug (e.g. the site slug or article slug).

**Collection**
: A namespaced bucket of records on a PDS. Scribe uses two:
  `app.scribe.site` and `app.scribe.article`.

---

## Scribe Domain Concepts

**Site**
: An author's publication — the top-level container for all their
  articles. Stored as a record in the `app.scribe.site` collection.
  Carries metadata (title, description, logo) and the full list of articles
  via `groups` and `ungroupedArticles`.

**Site URL (`url`)**
: The domain (TLD) of the site, e.g. `anthonycregan.co.uk`. Does not
  include a protocol or path.

**URL prefix (`urlPrefix`)**
: An optional path segment under which all site content lives. A prefix
  of `blog` means the site root is `anthonycregan.co.uk/blog` and all
  groups and articles are children of that path:
  `{url}/{urlPrefix}/{group-slug}/{article-slug}`.
  When blank, groups are immediate children of the domain:
  `{url}/{group-slug}/{article-slug}`.

**Site slug**
: The `rkey` used to fetch a site record. Derived automatically from the
  site's domain at creation time — not entered or editable by the author.
  Derivation rule: replace every `.` with `-`, then strip all remaining
  non-alphanumeric characters.
  Example: `norobots.blog` → `norobots-blog`.
  Defined in Scribe CMS as `url.replace(/\./g, "-").replace(/[^a-z0-9-]/g, "")`.

**Article**
: A single piece of written content. In the Draft state, stored as a
  record in the `app.scribe.article` collection using the
  `site.standard.document` field shape (minus `site` and `publishedAt`,
  which are absent until publish). On publish, moved to the
  `site.standard.document` collection with `site` and `publishedAt` set.

**Article slug**
: The `rkey` used to fetch an article record. Appears as the URL path
  segment for the article. Unchanged across the draft → publish
  transition — the same slug is used as the rkey in both
  `app.scribe.article` and `site.standard.document`.

**`publishedAt`**
: The timestamp of the instant an article transitions from Draft to
  Unpublished — i.e. when it is first moved to `site.standard.document`.
  Set once at publish time; never updated thereafter. Absent on draft
  records in `app.scribe.article`.

**`createdAt`**
: A Scribe extension field retained on `site.standard.document` records
  alongside the standard.site fields. Records the instant the draft was
  first created in `app.scribe.article`. Set once; never changed.
  Distinct from `publishedAt` — an article may sit as a draft for days
  or weeks before being published.

**ArticleRef**
: The internal schema type for a lightweight article snapshot cached
  inside the site record. Contains enough metadata (title, slug, synopsis,
  splash image) to render an article list without fetching each article
  individually. Avoids N+1 fetch patterns. A code-level concept intended
  for developers; not surfaced in the Scribe CMS UI.

**Group (SiteGroup)**
: A named collection of articles within a site, used to organise content
  into sections or categories. Each group has a `slug` and `title` and
  carries an array of `ArticleRef`s.

**Ungrouped articles**
: Articles stored in `ungroupedArticles` on the site record — articles
  the author has assigned to a site but not yet placed in any group.
  These are in the **Unpublished** state. See *Publication states* below.

**Canonical Site**
: The single site nominated by the author as the primary publication for
  an article at the point of publishing. Stored in the `site` field of
  the `site.standard.document` record as the `https://` root URL of that
  publication (e.g. `https://norobots.blog`, or `https://norobots.blog/blog`
  if a `urlPrefix` is set). Used by standard.site-compatible aggregators
  and Bluesky to identify which publication an article belongs to.
  When an article is published to only one site, that site is automatically
  the Canonical Site. When published to multiple sites, the author is
  prompted to nominate one. An article has exactly one Canonical Site.
  Distinct from site membership — an article may appear in many site
  manifests; the Canonical Site is the one that represents it in the
  broader AT Protocol ecosystem.

**Publication states**
: The three states an article can be in, from the perspective of
  visibility and site assignment:
  - **Draft** — the article exists on the author's PDS in the
    `app.scribe.article` collection but is not referenced in any site
    record. Not yet associated with any site. No `site` field.
  - **Unpublished** — the article has been published (moved to
    `site.standard.document`, `site` field set) but is referenced only
    in a site's `ungroupedArticles`. It belongs to a site but has not
    been placed in any named group.
  - **Published** — the article is referenced in a named group within a
    site record. It has a canonical URL on the author's consumer site.

---

## SDK Concepts

**Author**
: The person who created the content. Identified by a DID or handle.
  Passed as the first argument to all core fetch functions and hooks.

**Developer**
: A person using this SDK to display Scribe content in their own
  application or site. The intended audience of all public API surfaces,
  documentation, and error messages.

**AbortSignal**
: Passed as an optional argument to core fetch functions, and wired up
  automatically by framework adapters, to cancel in-flight requests when a
  component unmounts, parameters change, or a subscription is cancelled.

**PDS cache**
: An in-memory `Map` inside `packages/core/src/resolve.ts` that stores
  resolved PDS endpoints keyed by DID. Prevents redundant DID document
  fetches within a single page load.

**Injection function**
: An Angular-idiomatic function (e.g. `injectSite`, `injectArticle`) that
  uses Angular's `inject()` API internally. Must be called within an
  injection context (constructor, field initialiser, or
  `runInInjectionContext()`). Returns reactive signals and registers cleanup
  via `DestroyRef`.

**Observable**
: An RxJS lazy data stream returned by `ScribeService` methods. Cold —
  the fetch does not start until subscribe is called. Cancels the underlying
  request when unsubscribed.

**Signal**
: An Angular reactive primitive (Angular 16+) returned by injection
  functions. Synchronously readable via `signal()` call syntax. Updated
  in-place as the fetch resolves.
