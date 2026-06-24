import type { Site } from "./types.js";

export interface FeedOptions {
  baseUrl: string;
  feedUrl?: string;
  language?: string;
  limit?: number;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(text: string): string {
  return `<![CDATA[${text}]]>`;
}

function siteLink(baseUrl: string, urlPrefix: string): string {
  if (!urlPrefix) return baseUrl;
  return `${baseUrl}/${urlPrefix}`;
}

function articleLink(
  baseUrl: string,
  urlPrefix: string,
  groupSlug: string,
  articleUrl: string
): string {
  const prefix = urlPrefix ? `${urlPrefix}/` : "";
  return `${baseUrl}/${prefix}${groupSlug}/${articleUrl}`;
}

export function generateFeed(site: Site, options: FeedOptions): string {
  const language = options.language ?? "en";
  const channelLink = siteLink(options.baseUrl, site.urlPrefix ?? "");
  const description = site.description ?? site.title;

  // Collect all published articles from groups with their group context
  const allItems: Array<{
    groupSlug: string;
    article: (typeof site.groups)[0]["articles"][0];
  }> = [];
  for (const group of site.groups) {
    for (const article of group.articles) {
      allItems.push({ groupSlug: group.slug, article });
    }
  }

  const limitedItems =
    options.limit !== undefined ? allItems.slice(0, options.limit) : allItems;

  const atomNs = options.feedUrl
    ? ' xmlns:atom="http://www.w3.org/2005/Atom"'
    : "";

  const atomLink = options.feedUrl
    ? `<atom:link href="${escapeXml(options.feedUrl)}" rel="self" type="application/rss+xml"/>`
    : "";

  const items = limitedItems
    .map(({ groupSlug, article }) => {
      const link = articleLink(
        options.baseUrl,
        site.urlPrefix ?? "",
        groupSlug,
        article.slug ?? ""
      );
      const pubDate = article.publishedAt ?? article.createdAt;
      return [
        "<item>",
        `<title>${cdata(article.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<description>${cdata(article.description ?? "")}</description>`,
        `<pubDate>${new Date(pubDate).toUTCString()}</pubDate>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        "</item>",
      ].join("");
    })
    .join("");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0"${atomNs}>`,
    "<channel>",
    `<title>${cdata(site.title)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${cdata(description)}</description>`,
    `<language>${escapeXml(language)}</language>`,
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    atomLink,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
