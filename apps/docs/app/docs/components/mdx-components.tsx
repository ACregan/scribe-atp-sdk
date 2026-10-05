import {
  Children,
  isValidElement,
  useId,
  useState,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";
import { Link } from "react-router";

// Passed as the `components` prop to every compiled `.mdx` page (see
// route.tsx). Element overrides keep prose behaviour sane (internal links
// use the router, wide tables scroll); the capitalised entries are
// components guide authors can use directly in `.mdx`.

function DocsLink({
  href = "",
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const isHash = href.startsWith("#");

  if (isInternal) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  if (isHash) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  );
}

function DocsTable(props: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="docs-table-scroll">
      <table {...props} />
    </div>
  );
}

type CalloutType = "note" | "tip" | "warning";
const CALLOUT_LABEL: Record<CalloutType, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Careful",
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <p className="docs-callout__label">{title ?? CALLOUT_LABEL[type]}</p>
      {children}
    </div>
  );
}

export function ForkGrid({ children }: { children: ReactNode }) {
  return <div className="docs-forkgrid">{children}</div>;
}

export function ForkCard({
  to,
  title,
  children,
}: {
  to: string;
  title: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      <div className="docs-forkcard__title">{title}</div>
      <div className="docs-forkcard__body">{children}</div>
    </>
  );
  return to.startsWith("/") ? (
    <Link to={to} className="docs-forkcard">
      {inner}
    </Link>
  ) : (
    <a
      href={to}
      className="docs-forkcard"
      target="_blank"
      rel="noreferrer noopener"
    >
      {inner}
    </a>
  );
}

export function Tab({ children }: { label: string; children: ReactNode }) {
  return <>{children}</>;
}

export function Tabs({ children }: { children: ReactNode }) {
  const base = useId();
  const panels = Children.toArray(children).filter(
    (c): c is ReactElement<{ label: string; children: ReactNode }> =>
      isValidElement(c),
  );
  const [active, setActive] = useState(0);

  if (panels.length === 0) return null;

  return (
    <div className="docs-tabs">
      <div className="docs-tabs__bar" role="tablist">
        {panels.map((panel, i) => (
          <button
            key={`${base}-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            className="docs-tabs__tab"
            data-active={i === active || undefined}
            onClick={() => setActive(i)}
          >
            {panel.props.label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={`${base}-panel-${i}`}
          role="tabpanel"
          className="docs-tabs__panel"
          hidden={i !== active}
        >
          {panel.props.children}
        </div>
      ))}
    </div>
  );
}

export const mdxComponents = {
  a: DocsLink,
  table: DocsTable,
  Callout,
  ForkGrid,
  ForkCard,
  Tabs,
  Tab,
} as Record<string, React.ComponentType<unknown>>;
