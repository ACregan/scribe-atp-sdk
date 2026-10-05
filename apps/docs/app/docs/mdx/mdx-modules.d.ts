// Ambient types for the guide's `.mdx` content modules. Each compiled
// module default-exports its content component and (via the local
// `remark-toc` plugin) a `tableOfContents` array.
declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { TocEntry } from "./remark-toc";

  export const tableOfContents: TocEntry[];
  export const tableOfContentsOverride: TocEntry[] | undefined;

  const MDXContent: ComponentType<{
    components?: Record<string, ComponentType<unknown>>;
  }>;
  export default MDXContent;
}

// Plain Markdown compiled by the same MDX pipeline (vite.config.ts) — the
// repo root's RELEASES.md, rendered by reference/full-changelog.mdx.
declare module "*.md" {
  import type { ComponentType } from "react";
  import type { TocEntry } from "./remark-toc";

  export const tableOfContents: TocEntry[];

  const MDContent: ComponentType<{
    components?: Record<string, ComponentType<unknown>>;
  }>;
  export default MDContent;
}
