import { Link } from "react-router";
import { docsHref, type DocsPage } from "../nav";

interface PagerProps {
  prev: DocsPage | null;
  next: DocsPage | null;
}

export function Pager({ prev, next }: PagerProps) {
  if (!prev && !next) return null;

  return (
    <nav className="docs-pager" aria-label="Docs pagination">
      {prev ? (
        <Link
          to={docsHref(prev.slug)}
          className="docs-pager__link docs-pager__link--prev"
        >
          <span className="docs-pager__dir">← Previous</span>
          <span className="docs-pager__title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={docsHref(next.slug)}
          className="docs-pager__link docs-pager__link--next"
        >
          <span className="docs-pager__dir">Next →</span>
          <span className="docs-pager__title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
