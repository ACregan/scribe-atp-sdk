import type { Site, Article } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";

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

export async function fetchSite(
  author: string,
  siteSlug: string,
  signal?: AbortSignal
): Promise<Site> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);

  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "site.standard.publication");
  url.searchParams.set("rkey", siteSlug);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch site: ${res.statusText}`);

  const data = (await res.json()) as { value: RawPublication };
  const scribe = data.value.scribe;
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
