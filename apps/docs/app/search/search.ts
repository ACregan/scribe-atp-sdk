import { matchScore } from "./matcher";
import type { SearchEntry } from "./buildIndex";

export const MIN_QUERY_LENGTH = 2;

/**
 * Ranks index entries against a query with the Omnibar's matcher. Every
 * query term must hit the title, keywords or context. Ties go to entries
 * whose title matched (not just a keyword), then pages before headings,
 * then shorter titles, so "fetchSite" puts its own heading first.
 */
export function searchEntries(
  index: SearchEntry[],
  query: string,
  limit = 12,
): SearchEntry[] {
  if (query.trim().length < MIN_QUERY_LENGTH) return [];

  const scored: Array<{ entry: SearchEntry; score: number; titleHit: boolean }> = [];
  for (const entry of index) {
    const score = matchScore(query, [entry.title, entry.keywords, entry.context]);
    if (score === null) continue;
    const titleHit = matchScore(query, [entry.title]) !== null;
    scored.push({ entry, score, titleHit });
  }

  scored.sort(
    (a, b) =>
      Number(b.titleHit) - Number(a.titleHit) ||
      b.score - a.score ||
      Number(b.entry.kind === "page") - Number(a.entry.kind === "page") ||
      a.entry.title.length - b.entry.title.length,
  );

  return scored.slice(0, limit).map((s) => s.entry);
}
