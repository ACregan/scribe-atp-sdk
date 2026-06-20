import type { Site } from "./types.js";

export interface SitemapOptions {
  baseUrl: string;
}

function siteIndexUrl(baseUrl: string, urlPrefix: string): string {
  if (!urlPrefix) return baseUrl;
  return `${baseUrl}/${urlPrefix}`;
}

function groupUrl(baseUrl: string, urlPrefix: string, groupSlug: string): string {
  const prefix = urlPrefix ? `${urlPrefix}/` : "";
  return `${baseUrl}/${prefix}${groupSlug}`;
}

function articleUrl(
  baseUrl: string,
  urlPrefix: string,
  groupSlug: string,
  articleSlug: string
): string {
  const prefix = urlPrefix ? `${urlPrefix}/` : "";
  return `${baseUrl}/${prefix}${groupSlug}/${articleSlug}`;
}

function urlEntry(loc: string, lastmod?: string): string {
  const lastmodTag =
    lastmod && lastmod.length > 0 ? `<lastmod>${lastmod}</lastmod>` : "";
  return `<url><loc>${loc}</loc>${lastmodTag}</url>`;
}

export function generateSitemap(site: Site, options: SitemapOptions): string {
  const prefix = site.urlPrefix ?? "";
  const entries: string[] = [];

  // 1. Homepage
  entries.push(urlEntry(options.baseUrl));

  // 2. Blog index (only when the blog lives at a sub-path, not the root)
  if (prefix) {
    entries.push(urlEntry(`${options.baseUrl}/${prefix}`));
  }

  // 3. Group pages and article pages
  for (const group of site.groups) {
    entries.push(urlEntry(groupUrl(options.baseUrl, prefix, group.slug)));

    for (const article of group.articles) {
      const loc = articleUrl(
        options.baseUrl,
        prefix,
        group.slug,
        article.url ?? ""
      );
      const lastmod =
        article.updatedAt && article.updatedAt.length > 0
          ? new Date(article.updatedAt).toISOString().split("T")[0]
          : undefined;
      entries.push(urlEntry(loc, lastmod));
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</urlset>`,
  ].join("");
}
