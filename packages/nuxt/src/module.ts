import { defineNuxtModule, addImportsDir, createResolver } from "@nuxt/kit";

export default defineNuxtModule({
  meta: {
    name: "@skyscribe-sdk/nuxt",
    configKey: "scribe",
  },
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);
    addImportsDir(resolver.resolve("./composables"));
  },
});
