import type { Site, SiteRecord, ArticleRef } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";

interface RawSite extends Omit<Site, "groups" | "ungroupedArticles"> {
  groups?: Site["groups"];
  ungroupedArticles?: Site["ungroupedArticles"];
}

interface RawArticle {
  title: string;
  url: string;
  splashImageUrl?: string | null;
  synopsis?: string | null;
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
  const records = await listAllRecords<RawSite>(pdsUrl, did, "app.scribe.site", signal);

  return records.map(({ uri, value }) => ({
    uri,
    ...value,
    groups: value.groups ?? [],
    ungroupedArticles: value.ungroupedArticles ?? [],
  }));
}

export async function listArticles(
  author: string,
  signal?: AbortSignal
): Promise<ArticleRef[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawArticle>(pdsUrl, did, "app.scribe.article", signal);

  return records.map(({ uri, value }) => ({
    uri,
    title: value.title,
    url: value.url,
    splashImageUrl: value.splashImageUrl ?? null,
    synopsis: value.synopsis,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }));
}
