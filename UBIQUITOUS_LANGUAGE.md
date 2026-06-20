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
: A single piece of written content. Stored as a record in the
  `app.scribe.article` collection. Contains the full HTML content,
  title, timestamps, and optional splash image.

**Article slug**
: The `rkey` used to fetch an article record. Appears as the URL path
  segment for the article.

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
  the author has not assigned to any group. Being ungrouped is the draft
  state; being assigned to a group is the published state. The
  group-membership distinction is the sole publish/draft boundary.

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
  automatically by React hooks, to cancel in-flight requests when a
  component unmounts or parameters change.

**PDS cache**
: An in-memory `Map` inside `packages/core/src/resolve.ts` that stores
  resolved PDS endpoints keyed by DID. Prevents redundant DID document
  fetches within a single page load.
