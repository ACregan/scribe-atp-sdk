import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrism from "rehype-prism-plus";
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
          // Build-time highlighting: Prism's `token <type>` classes, the
          // same ones @skyscribe-sdk/styles colours. Unknown languages
          // (e.g. astro) render as plain code.
          [rehypePrism, { ignoreMissing: true }],
          [
            rehypeAutolinkHeadings,
            { behavior: "wrap", properties: { className: "docs-anchor" } },
          ],
        ],
      }),
    },
    reactRouter(),
  ],
  // React Router prerenders by starting Vite's preview server and fetching
  // each page from it. Bound to "localhost", the server can listen on ::1
  // while the fetch goes to 127.0.0.1 (seen in the CI container:
  // ECONNREFUSED 127.0.0.1). Pin it to IPv4.
  preview: {
    host: "127.0.0.1",
  },
  resolve: {
    // Mirrors tsconfig.json's `~/*` path (Vite 7 has no tsconfigPaths).
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
});
