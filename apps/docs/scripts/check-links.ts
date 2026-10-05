// Checks links in the built site (build/client). Run after `npm run build`.
//
//   node scripts/check-links.ts             internal links and #anchors (CI: blocking)
//   node scripts/check-links.ts --external  also fetches external links (CI: advisory)
//
// Internal checking needs no network, so it can gate merges. External
// links depend on other people's servers, so they only warn.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "build", "client");
const checkExternal = process.argv.includes("--external");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name === "index.html" ? [path] : [];
  });
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
}

// "/api/core" for build/client/api/core/index.html, "/" for the home page.
const pages = new Map<string, string>();
for (const file of htmlFiles(root)) {
  const dir = relative(root, dirname(file)).split(sep).join("/");
  pages.set(dir === "" ? "/" : `/${dir}`, readFileSync(file, "utf8"));
}

const ids = new Map<string, Set<string>>();
for (const [path, html] of pages) {
  ids.set(path, new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => decode(m[1]))));
}

const broken: string[] = [];
const external = new Map<string, string>(); // url → first page it's on

for (const [path, html] of pages) {
  // Only links in the page itself, not the shell's header/menu/footer
  // repeated on every page (those are covered by the home page's check).
  const body = path === "/" ? html : html.slice(html.indexOf("<main"));
  for (const m of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^https?:\/\//.test(href)) {
      if (!external.has(href)) external.set(href, path);
      continue;
    }
    if (href.startsWith("mailto:")) continue;
    const [target, anchor] = href.split("#");
    const targetPath = target === "" ? path : target.replace(/\/$/, "") || "/";
    if (!pages.has(targetPath)) {
      broken.push(`${path}: ${href} (no such page)`);
    } else if (anchor && !ids.get(targetPath)!.has(anchor)) {
      broken.push(`${path}: ${href} (no #${anchor} on ${targetPath})`);
    }
  }
}

console.log(`${pages.size} pages checked.`);
if (broken.length > 0) {
  console.error(`${broken.length} broken internal link(s):\n  ${broken.join("\n  ")}`);
  process.exitCode = 1;
}

if (checkExternal) {
  // Node tries IPv6 and IPv4 in turn with a 250 ms attempt timeout. On
  // networks without working IPv6 (this repo's WSL dev box) a slow IPv4
  // handshake then times out and a live site looks dead.
  setDefaultAutoSelectFamilyAttemptTimeout(3000);
  const failures: string[] = [];
  await Promise.all(
    [...external].map(async ([url, page]) => {
      try {
        const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
        // Some sites (npm) refuse non-browser clients with 403; that isn't
        // a dead link.
        if (res.status >= 400 && res.status !== 403 && res.status !== 429) {
          failures.push(`${page}: ${url} (${res.status})`);
        }
      } catch (err) {
        failures.push(`${page}: ${url} (${(err as Error).message})`);
      }
    }),
  );
  console.log(`${external.size} external links checked.`);
  if (failures.length > 0) {
    console.error(`${failures.length} failing external link(s):\n  ${failures.join("\n  ")}`);
    process.exitCode = 1;
  }
}
