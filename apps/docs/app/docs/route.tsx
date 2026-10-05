import type { ComponentType } from "react";
import type { Route } from "./+types/route";
import {
  adjacentDocsPages,
  docsHref,
  findDocsPage,
  sectionForSlug,
} from "./nav";
import type { TocEntry } from "./mdx/remark-toc";
import { DocsArticle } from "./components/DocsArticle";
import { mdxComponents } from "./components/mdx-components";
import "./docs.css";

// Production URL for <link rel="canonical">, whatever origin served it.
const CANONICAL_ORIGIN = "https://sdk.skyscribe.app";

interface ContentModule {
  default: ComponentType<{
    components?: Record<string, ComponentType<unknown>>;
  }>;
  tableOfContents?: TocEntry[];
}

// Eager, as in skyscribe-app's User Guide: docs navigation is instant and
// the whole set is small prose.
const contentModules = import.meta.glob<ContentModule>("../content/**/*.mdx", {
  eager: true,
});

function contentKeyForSlug(slug: string): string {
  return slug === "" ? "../content/index.mdx" : `../content/${slug}.mdx`;
}

function slugFromParams(params: Record<string, string | undefined>): string {
  return (params["*"] ?? "").replace(/\/$/, "");
}

export function meta({ params }: Route.MetaArgs) {
  const slug = slugFromParams(params);
  const page = findDocsPage(slug);
  if (!page) {
    return [{ title: "Page not found — SkyScribe SDK" }];
  }
  return [
    {
      title: slug === "" ? "SkyScribe SDK" : `${page.title} — SkyScribe SDK`,
    },
    { name: "description", content: page.description },
    {
      tagName: "link",
      rel: "canonical",
      href: `${CANONICAL_ORIGIN}${docsHref(slug)}`,
    },
  ];
}

export default function DocsRoute({ params }: Route.ComponentProps) {
  const slug = slugFromParams(params);
  const page = findDocsPage(slug);

  if (!page) {
    return (
      <DocsArticle slug={slug} toc={[]} prev={null} next={null}>
        <h1>Page not found</h1>
        <p>
          There's no docs page at this address. Use the menu or the search
          bar to find what you're looking for.
        </p>
      </DocsArticle>
    );
  }

  const mod = contentModules[contentKeyForSlug(slug)];
  const { prev, next } = adjacentDocsPages(slug);

  return (
    <DocsArticle
      slug={slug}
      sectionTitle={sectionForSlug(slug)?.title}
      toc={mod?.tableOfContents ?? []}
      prev={prev}
      next={next}
    >
      {mod ? (
        <mod.default components={mdxComponents} />
      ) : (
        // Pages listed in nav.ts whose content hasn't been ported yet.
        <>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <p className="docs-stub">This page is being written.</p>
        </>
      )}
    </DocsArticle>
  );
}
