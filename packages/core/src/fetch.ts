import type { Site, Article } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";

export async function fetchSite(
  author: string,
  siteSlug: string,
  signal?: AbortSignal
): Promise<Site> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);

  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "app.scribe.site");
  url.searchParams.set("rkey", siteSlug);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch site: ${res.statusText}`);

  const data = (await res.json()) as { value: Site };
  return data.value;
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
  url.searchParams.set("collection", "app.scribe.article");
  url.searchParams.set("rkey", articleSlug);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch article: ${res.statusText}`);

  const data = (await res.json()) as { value: Article };
  return data.value;
}
