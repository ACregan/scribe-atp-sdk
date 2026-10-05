import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// One layout (the skyscribe.app-style shell) around one module that serves
// every docs page. The splat doesn't match "/", so the home page is an
// index route using the same module under its own id. The slug → content
// mapping is in docs/route.tsx, and the page list is docs/nav.ts.
export default [
  layout("layout/DocsLayout.tsx", [
    index("docs/route.tsx", { id: "docs/home" }),
    route("*", "docs/route.tsx"),
  ]),
] satisfies RouteConfig;
