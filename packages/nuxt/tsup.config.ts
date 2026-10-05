import { readdirSync } from "node:fs";
import { defineConfig } from "tsup";

// The module (src/module.ts) auto-imports everything in ./composables,
// resolved next to the built entry: dist/composables/. Each composable is
// built there as its own file. Before this, only src/index.ts was built,
// so the published package had no composables at all.
const composables = readdirSync("src/composables")
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => `src/composables/${f}`);

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    // module.ts resolves ./composables from import.meta.url, which is
    // empty in a CJS build without the shim.
    shims: true,
    external: ["nuxt", "@nuxt/kit", "#app"],
  },
  {
    // ESM only: Nuxt scans every .js/.cjs file in the folder, so a CJS
    // copy would register each composable twice. `#app` is Nuxt's own
    // runtime import and must stay external.
    entry: composables,
    outDir: "dist/composables",
    format: ["esm"],
    dts: true,
    external: ["nuxt", "@nuxt/kit", "#app", "@skyscribe-sdk/core"],
  },
]);
