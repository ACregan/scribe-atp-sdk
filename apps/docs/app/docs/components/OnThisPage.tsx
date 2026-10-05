import { useEffect, useState } from "react";
import type { TocEntry } from "../mdx/remark-toc";

interface OnThisPageProps {
  toc: TocEntry[];
}

export function OnThisPage({ toc }: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Highest heading currently in view wins; if none, keep the last.
        const firstVisible = toc.find((e) => visible.has(e.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      {
        // Headings scroll inside `.docs` (#docs-scroll), not the window — see
        // DocsArticle. Fall back to the viewport if it isn't there yet.
        root: document.getElementById("docs-scroll"),
        rootMargin: "0px 0px -72% 0px",
        threshold: 0,
      },
    );

    for (const el of headings) observer.observe(el);
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) {
    return <div className="docs-toc" aria-hidden="true" />;
  }

  return (
    <aside className="docs-toc" aria-label="On this page">
      <p className="docs-toc__heading">On this page</p>
      <ul className="docs-toc__list">
        {toc.map((entry) => (
          <li
            key={entry.id}
            className={
              entry.depth === 3
                ? "docs-toc__item docs-toc__item--h3"
                : "docs-toc__item"
            }
          >
            <a
              href={`#${entry.id}`}
              data-active={entry.id === activeId ? "true" : undefined}
            >
              {entry.value}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
