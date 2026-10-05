import type { Config } from "@react-router/dev/config";
import { allDocsPages, docsHref } from "./app/docs/nav";

// Fully static (ADR 0003): no server at request time. Every docs page is
// prerendered to HTML at build time from the nav, and Cloudflare serves
// build/client/ as plain files.
export default {
  ssr: false,
  // "/404" renders the not-found page; scripts/postbuild.ts turns it into
  // 404.html for Cloudflare.
  prerender: ["/", "/404", ...allDocsPages.map((page) => docsHref(page.slug))],
} satisfies Config;
