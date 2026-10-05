import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import interLatinUrl from "~/styles/fonts/Inter-latin.woff2?url";

export const links: Route.LinksFunction = () => [
  // Same favicon set as skyscribe.app (public/images/favicons/).
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/images/favicons/favicon-16x16.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/images/favicons/favicon-32x32.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/images/favicons/apple-touch-icon.png",
  },
  { rel: "manifest", href: "/images/favicons/site.webmanifest" },
  {
    rel: "preload",
    href: interLatinUrl,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: /theme-init.js sets data-theme on <html>
    // before React hydrates, and the prerendered HTML can't know it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#171f25"
        />
        {/* Blocking on purpose: sets data-theme before first paint so a
            dark-mode visitor never sees a light flash. A file rather than
            an inline script, so the CSP needs no hash for it. */}
        <script src="/theme-init.js" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
