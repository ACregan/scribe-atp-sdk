import type { ReactNode } from "react";
import { Link } from "react-router";
import { docsHref, sectionForSlug, type DocsPage } from "../nav";
import type { TocEntry } from "../mdx/remark-toc";
import { OnThisPage } from "./OnThisPage";
import { Pager } from "./Pager";

interface DocsArticleProps {
  slug: string;
  sectionTitle?: string;
  toc: TocEntry[];
  prev: DocsPage | null;
  next: DocsPage | null;
  children: ReactNode;
}

// skyscribe-app's GuideLayout: renders inside the shell's <main>, which is
// a fixed-height panel; `.docs` is the page's own scroll container. The
// sidebar lists the pages of the current section only (the side menu
// switches between sections).
export function DocsArticle({
  slug,
  sectionTitle,
  toc,
  prev,
  next,
  children,
}: DocsArticleProps) {
  const section = sectionForSlug(slug);

  return (
    <div className="docs" id="docs-scroll">
      <div className="docs-body">
        <nav className="docs-sidebar" aria-label={section?.title ?? "Docs"}>
          {section && (
            <div className="docs-nav__section">
              <p className="docs-nav__heading">{section.title}</p>
              <ul className="docs-nav__list">
                {section.pages.map((page) => (
                  <li key={page.slug}>
                    {/* Link, not NavLink: NavLink's `end` matching is exact,
                        so "/api/core/" (trailing slash) wouldn't count as
                        active. The slug has already had it stripped. */}
                    <Link
                      to={docsHref(page.slug)}
                      className="docs-nav__link"
                      aria-current={page.slug === slug ? "page" : undefined}
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
        <div className="docs-content-col">
          <article className="docs-article">
            {sectionTitle && slug !== "" && (
              <p className="docs-eyebrow">{sectionTitle}</p>
            )}
            <div className="docs-prose">{children}</div>
            <Pager prev={prev} next={next} />
          </article>
        </div>
        <OnThisPage toc={toc} />
      </div>
    </div>
  );
}
