import type { Site, Article, ArticleResult } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";
import { slugFromUri } from "./utils.js";

const publicationUriCache = new Map<string, string>();

export function _clearPublicationUriCache(): void {
  publicationUriCache.clear();
}

interface ScribeManifest {
  domain: string;
  basePath: string;
  title: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  groups?: Site["groups"];
  ungroupedArticles?: Site["ungroupedArticles"];
}

interface RawPublication {
  url?: string;
  name?: string;
  scribe: ScribeManifest;
}

interface RawDocument {
  title: string;
  path: string;
  site: string;
  canonicalUrl?: string;
  publishedAt: string;
  description?: string;
  content?: { $type: string; html?: string } | unknown;
  splashImageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function extractHtml(content: RawDocument["content"]): string {
  if (
    content !== null &&
    typeof content === "object" &&
    (content as Record<string, unknown>)["$type"] === "app.scribe.content.html"
  ) {
    return String((content as Record<string, unknown>)["html"] ?? "");
  }
  return "";
}

export async function resolvePublicationUri(
  author: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const normalizedUrl = normalizeUrl(publicationUrl);
  const did = await resolveIdentifier(author, signal);
  const cacheKey = `${did}:${normalizedUrl}`;
  const cached = publicationUriCache.get(cacheKey);
  if (cached) return cached;

  const pdsUrl = await resolvePds(did, signal);
  const listUrl = new URL(`${pdsUrl}/xrpc/com.atproto.repo.listRecords`);
  listUrl.searchParams.set("repo", did);
  listUrl.searchParams.set("collection", "site.standard.publication");
  listUrl.searchParams.set("limit", "100");
  const res = await fetch(listUrl, { signal });
  if (!res.ok) throw new Error(`Failed to fetch publications: ${res.statusText}`);
  const data = (await res.json()) as {
    records: Array<{ uri: string; value: RawPublication }>;
  };
  const record = data.records.find(
    (r) => normalizeUrl(r.value.url ?? "") === normalizedUrl
  );
  if (!record) throw new Error(`Site not found: ${publicationUrl}`);
  publicationUriCache.set(cacheKey, record.uri);
  return record.uri;
}

export async function fetchSite(
  author: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<Site> {
  const normalizedUrl = normalizeUrl(publicationUrl);
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const cacheKey = `${did}:${normalizedUrl}`;
  const cachedUri = publicationUriCache.get(cacheKey);

  let scribe: ScribeManifest;

  if (cachedUri) {
    const rkey = cachedUri.split("/").pop()!;
    const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
    url.searchParams.set("repo", did);
    url.searchParams.set("collection", "site.standard.publication");
    url.searchParams.set("rkey", rkey);
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Failed to fetch site: ${res.statusText}`);
    const data = (await res.json()) as { value: RawPublication };
    scribe = data.value.scribe;
  } else {
    const listUrl = new URL(`${pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    listUrl.searchParams.set("repo", did);
    listUrl.searchParams.set("collection", "site.standard.publication");
    listUrl.searchParams.set("limit", "100");
    const res = await fetch(listUrl, { signal });
    if (!res.ok) throw new Error(`Failed to fetch site: ${res.statusText}`);
    const data = (await res.json()) as {
      records: Array<{ uri: string; value: RawPublication }>;
    };
    const record = data.records.find(
      (r) => normalizeUrl(r.value.url ?? "") === normalizedUrl
    );
    if (!record) throw new Error(`Site not found: ${publicationUrl}`);
    publicationUriCache.set(cacheKey, record.uri);
    scribe = record.value.scribe;
  }

  return {
    title: scribe.title,
    url: scribe.domain,
    urlPrefix: scribe.basePath,
    description: scribe.description,
    splashImageUrl: scribe.splashImageUrl,
    logoImageUrl: scribe.logoImageUrl,
    groups: scribe.groups ?? [],
    ungroupedArticles: scribe.ungroupedArticles ?? [],
  };
}

export async function fetchArticle(
  author: string,
  articleSlug: string,
  signal?: AbortSignal
): Promise<Article> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);

  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "site.standard.document");
  url.searchParams.set("rkey", articleSlug);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch article: ${res.statusText}`);

  const data = (await res.json()) as { value: RawDocument };
  const raw = data.value;
  return {
    title: raw.title,
    content: extractHtml(raw.content),
    path: raw.path,
    site: raw.site,
    canonicalUrl: raw.canonicalUrl,
    publishedAt: raw.publishedAt,
    description: raw.description,
    splashImageUrl: raw.splashImageUrl,
    tags: raw.tags,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function fetchArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  signal?: AbortSignal
): Promise<ArticleResult> {
  const site = await fetchSite(author, publicationUrl, signal);

  const allRefs = [
    ...site.ungroupedArticles,
    ...site.groups.flatMap((g) => g.articles),
  ];

  const ref = allRefs.find(
    (r) => r.slug === articleSlug || slugFromUri(r.uri) === articleSlug
  );

  if (!ref) throw new Error(`Article not found: ${articleSlug}`);

  const rkey = slugFromUri(ref.uri);
  const article = await fetchArticle(author, rkey, signal);
  return { article, uri: ref.uri };
}
