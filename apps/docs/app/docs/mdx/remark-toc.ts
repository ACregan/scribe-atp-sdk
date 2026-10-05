// Build-time remark plugin: collects the h2/h3 headings of a guide MDX
// page and injects `export const tableOfContents` into the compiled
// module, so the route can render an "On this page" rail without parsing
// the DOM after hydration.
//
// Heading slugs are produced with the same `github-slugger` algorithm
// `rehype-slug` uses (and, like it, a fresh slugger per file), so the
// ids here line up 1:1 with the `id` attributes `rehype-slug` writes
// onto the rendered headings — including its `-1`/`-2` disambiguation of
// repeated headings.
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { valueToEstree } from "estree-util-value-to-estree";
import GithubSlugger from "github-slugger";

export interface TocEntry {
  value: string;
  depth: 2 | 3;
  id: string;
}

// Typed loosely (no `mdast`/`unified` type deps) — this only runs inside
// the MDX compiler's remark pipeline at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const remarkToc = () => (tree: any) => {
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visit(tree, "heading", (node: any) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    const value = toString(node).trim();
    if (!value) return;
    toc.push({ value, depth: node.depth, id: slugger.slug(value) });
  });

  tree.children.unshift({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: "mdxjsEsm" as any,
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            source: null,
            specifiers: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { type: "Identifier", name: "tableOfContents" },
                  init: valueToEstree(toc),
                },
              ],
            },
          },
        ],
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
};
