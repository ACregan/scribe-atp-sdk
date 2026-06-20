import type { ArticleRef } from "./types.js";

export function toSlug(domain: string): string {
  return domain.replace(/\./g, "-").replace(/[^a-z0-9-]/g, "");
}

export function slugFromUri(uri: string): string {
  return uri.split("/").at(-1) ?? "";
}

export function flattenArticles(
  groups: Array<{ articles: ArticleRef[] }>
): ArticleRef[] {
  return groups.flatMap((g) => g.articles);
}
