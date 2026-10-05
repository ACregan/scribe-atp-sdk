// Runs after `react-router build` (package.json postbuild). Finishes the
// static site for Cloudflare (wrangler.jsonc):
//
// 1. 404.html: the prerendered /404 page, which Cloudflare serves for any
//    unknown path ("not_found_handling": "404-page").
// 2. Drops __spa-fallback.html: every page is prerendered, so it's unused.
// 3. A Content-Security-Policy <meta> on every page, allowing that page's
//    own inline scripts by hash. React Router's prerendered HTML has inline
//    scripts whose content differs per page, and a static site has no
//    per-request nonce, so hashes are the way to avoid 'unsafe-inline'.
//    frame-ancestors can't go in a <meta>; it's in public/_headers.
// 4. sitemap.xml and robots.txt, from the nav.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allDocsPages, docsHref } from "../app/docs/nav.ts";

const ORIGIN = "https://sdk.skyscribe.app";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "build", "client");

// 1 + 2
copyFileSync(join(out, "404", "index.html"), join(out, "404.html"));
rmSync(join(out, "404"), { recursive: true });
rmSync(join(out, "__spa-fallback.html"), { force: true });

// 3
function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

function cspFor(html: string): string {
  const hashes = [...html.matchAll(INLINE_SCRIPT)]
    .map((m) => m[1])
    .filter((body) => body.length > 0)
    .map((body) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  return [
    "default-src 'self'",
    `script-src 'self' ${[...new Set(hashes)].join(" ")}`.trim(),
    // As skyscribe.app: React sets some inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ");
}

let pages = 0;
for (const file of htmlFiles(out)) {
  const html = readFileSync(file, "utf8");
  if (!html.includes("<head>")) throw new Error(`no <head> in ${file}`);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${cspFor(html)}"/>`;
  // First thing in <head>, so it applies before any script.
  writeFileSync(file, html.replace("<head>", `<head>${meta}`));
  pages++;
}

// 4
const urls = allDocsPages
  .map((page) => `<url><loc>${ORIGIN}${page.slug === "" ? "" : docsHref(page.slug)}</loc></url>`)
  .join("");
writeFileSync(
  join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);

if (!existsSync(join(out, "404.html"))) throw new Error("404.html missing");
console.log(`postbuild: CSP on ${pages} pages, 404.html, sitemap.xml (${allDocsPages.length} URLs), robots.txt`);
