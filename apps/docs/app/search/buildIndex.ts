// Builds the search index from the docs' MDX source (run at build time by
// scripts/build-search-index.ts; kept here so it can be unit-tested).
//
// Per ADR 0003 the index covers page titles and descriptions, h2/h3
// headings (linking to their anchors), and the API names a page mentions
// in inline code. That's what developers search for (`withRetry`,
// "Request cancellation"); full text would need a heavier engine.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";

export interface SearchEntry {
  /** "page" for the page itself, "heading" for a section within it. */
  kind: "page" | "heading";
  /** What the result row shows, e.g. "withRetry" or "Quickstart". */
  title: string;
  /** Where it is: the section for a page, the page for a heading. */
  context: string;
  href: string;
  /** Extra matchable text: the page description, or API names on the page. */
  keywords?: string;
}

export interface SourcePage {
  slug: string;
  title: string;
  description: string;
  section: string;
  /** Raw MDX, or null for a page with no content file yet. */
  source: string | null;
}

// An identifier-looking piece of inline code: fetchSite, NotFoundError,
// useScribeSite, @skyscribe-sdk/core. Skips prose-ish code like `"blog"`.
const API_NAME = /^@?[A-Za-z_][\w./@-]{2,}$/;

function pageHref(slug: string): string {
  return `/${slug}`;
}

export function buildSearchIndex(pages: SourcePage[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

  for (const page of pages) {
    const href = pageHref(page.slug);
    const apiNames = new Set<string>();
    const headings: SearchEntry[] = [];

    if (page.source) {
      const tree = parser.parse(page.source);
      // Same algorithm and per-file instance as rehype-slug, so the anchors
      // match the rendered heading ids (remark-toc.ts does the same).
      const slugger = new GithubSlugger();

      visit(tree, (node) => {
        if (node.type === "heading") {
          const text = toString(node).trim();
          const id = text ? slugger.slug(text) : "";
          const depth = (node as { depth: number }).depth;
          if ((depth === 2 || depth === 3) && text) {
            headings.push({
              kind: "heading",
              title: text,
              context: page.title,
              href: `${href}#${id}`,
            });
          }
        }
        if (node.type === "inlineCode") {
          const value = (node as { value: string }).value.trim();
          if (API_NAME.test(value)) apiNames.add(value);
        }
      });
    }

    entries.push({
      kind: "page",
      title: page.title,
      context: page.section,
      href,
      keywords: [page.description, ...apiNames].join(" "),
    });
    entries.push(...headings);
  }

  return entries;
}
