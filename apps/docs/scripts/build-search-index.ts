// Writes public/search-index.json from the docs' MDX (see
// app/search/buildIndex.ts). Runs before `dev` and `build` (package.json
// pre-scripts). The output is generated, so it's gitignored.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { docsSections } from "../app/docs/nav.ts";
import { buildSearchIndex, type SourcePage } from "../app/search/buildIndex.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "app", "content");

const pages: SourcePage[] = docsSections.flatMap((section) =>
  section.pages.map((page) => {
    const file = join(contentDir, page.slug === "" ? "index.mdx" : `${page.slug}.mdx`);
    return {
      slug: page.slug,
      title: page.title,
      description: page.description,
      section: section.title,
      source: existsSync(file) ? readFileSync(file, "utf8") : null,
    };
  }),
);

const index = buildSearchIndex(pages);
const out = join(root, "public", "search-index.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(index));
console.log(`search index: ${index.length} entries → public/search-index.json`);
