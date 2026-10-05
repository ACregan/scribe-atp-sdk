import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkToc } from "./app/docs/mdx/remark-toc.ts";

// Same MDX pipeline as skyscribe-app's User Guide (its vite.config.ts).
// Vite 7, not 8 like skyscribe-app: the SDK workspace's vitest 3 hoists
// Vite 7, and @react-router/dev (also hoisted) must use the same copy.
export default defineConfig({
  plugins: [
    // Must precede reactRouter() so `.mdx` is already JS by the time the
    // router plugin sees it.
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            { behavior: "wrap", properties: { className: "docs-anchor" } },
          ],
        ],
      }),
    },
    reactRouter(),
  ],
  resolve: {
    // Mirrors tsconfig.json's `~/*` path (Vite 7 has no tsconfigPaths).
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
});
