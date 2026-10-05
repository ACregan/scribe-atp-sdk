import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the `toc` array the plugin hands to valueToEstree — that's the
// collection logic under test; the estree injection itself is
// build-pipeline plumbing.
const valueToEstreeMock = vi.hoisted(() =>
  vi.fn((_toc: unknown) => ({ type: "ArrayExpression", elements: [] })),
);
vi.mock("estree-util-value-to-estree", () => ({
  valueToEstree: valueToEstreeMock,
}));

import { remarkToc, type TocEntry } from "./remark-toc";

// Minimal mdast heading + text nodes.
const heading = (depth: number, text: string) => ({
  type: "heading",
  depth,
  children: [{ type: "text", value: text }],
});
const para = (text: string) => ({
  type: "paragraph",
  children: [{ type: "text", value: text }],
});

function runOn(children: unknown[]): TocEntry[] {
  const tree = { type: "root", children: [...children] };
  remarkToc()(tree);
  return valueToEstreeMock.mock.calls[0][0] as TocEntry[];
}

beforeEach(() => valueToEstreeMock.mockClear());

describe("remarkToc", () => {
  it("collects h2 and h3 headings with github-slugger ids", () => {
    expect(
      runOn([
        heading(1, "Page Title"),
        para("intro"),
        heading(2, "Getting Started"),
        heading(3, "Install the CLI"),
        heading(4, "Too deep"),
      ]),
    ).toEqual([
      { value: "Getting Started", depth: 2, id: "getting-started" },
      { value: "Install the CLI", depth: 3, id: "install-the-cli" },
    ]);
  });

  it("disambiguates repeated headings the same way rehype-slug does (-1, -2)", () => {
    expect(
      runOn([heading(2, "Notes"), heading(2, "Notes"), heading(2, "Notes")]),
    ).toEqual([
      { value: "Notes", depth: 2, id: "notes" },
      { value: "Notes", depth: 2, id: "notes-1" },
      { value: "Notes", depth: 2, id: "notes-2" },
    ]);
  });

  it("skips empty / whitespace-only headings", () => {
    expect(runOn([heading(2, "   "), heading(2, "Real")])).toEqual([
      { value: "Real", depth: 2, id: "real" },
    ]);
  });

  it("produces an empty toc for a page with no h2/h3", () => {
    expect(runOn([heading(1, "Only Title"), para("body")])).toEqual([]);
  });

  it("unshifts exactly one mdxjsEsm export node at the top of the tree", () => {
    const tree = {
      type: "root",
      children: [heading(2, "A")] as unknown[],
    };
    remarkToc()(tree);
    expect(tree.children).toHaveLength(2);
    expect((tree.children[0] as { type: string }).type).toBe("mdxjsEsm");
    expect((tree.children[1] as { type: string }).type).toBe("heading");
  });
});
