import type { Site, SiteRecord, ArticleRef } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";
import { slugFromUri } from "./utils.js";

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
  publishedAt: string;
  description?: string | null;
  splashImageUrl?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface ListRecordsPage<T> {
  records: Array<{ uri: string; cid: string; value: T }>;
  cursor?: string;
}

async function listAllRecords<T>(
  pdsUrl: string,
  did: string,
  collection: string,
  signal?: AbortSignal
): Promise<Array<{ uri: string; value: T }>> {
  const results: Array<{ uri: string; value: T }> = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set("repo", did);
    url.searchParams.set("collection", collection);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Failed to list ${collection}: ${res.statusText}`);

    const page = (await res.json()) as ListRecordsPage<T>;
    for (const record of page.records) {
      results.push({ uri: record.uri, value: record.value });
    }
    cursor = page.cursor;
  } while (cursor);

  return results;
}

export async function listSites(
  author: string,
  signal?: AbortSignal
): Promise<SiteRecord[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawPublication>(pdsUrl, did, "site.standard.publication", signal);

  return records
    .filter(({ value }) => value.scribe != null)
    .map(({ uri, value }) => ({
      uri,
      title: value.scribe.title,
      url: value.scribe.domain,
      urlPrefix: value.scribe.basePath,
      description: value.scribe.description,
      splashImageUrl: value.scribe.splashImageUrl,
      logoImageUrl: value.scribe.logoImageUrl,
      groups: value.scribe.groups ?? [],
      ungroupedArticles: value.scribe.ungroupedArticles ?? [],
    }));
}

export async function listArticles(
  author: string,
  signal?: AbortSignal
): Promise<ArticleRef[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawDocument>(pdsUrl, did, "site.standard.document", signal);

  return records.map(({ uri, value }) => ({
    uri,
    title: value.title,
    slug: slugFromUri(uri),
    splashImageUrl: value.splashImageUrl ?? null,
    description: value.description,
    tags: value.tags,
    createdAt: value.createdAt,
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
  }));
}
