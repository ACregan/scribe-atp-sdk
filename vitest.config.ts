import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@scribe-atp/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@scribe-atp/react": resolve(__dirname, "packages/react/src/index.ts"),
      "@scribe-atp/angular": resolve(__dirname, "packages/angular/src/index.ts"),
      "@scribe-atp/next": resolve(__dirname, "packages/next/src/index.ts"),
      "@scribe-atp/vue": resolve(__dirname, "packages/vue/src/index.ts"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          include: ["packages/core/src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "react",
          include: ["packages/react/src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "react-router-framework",
          include: ["packages/react-router-framework/src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "angular",
          include: ["packages/angular/src/**/*.test.ts"],
          environment: "jsdom",
          setupFiles: ["packages/angular/src/test-setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "next",
          include: ["packages/next/src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "vue",
          include: ["packages/vue/src/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "nuxt",
          include: ["packages/nuxt/src/**/*.test.ts"],
          environment: "node",
        },
        resolve: {
          alias: {
            "#app": resolve(__dirname, "packages/nuxt/node_modules/nuxt/dist/app/index.mjs"),
          },
        },
      },
    ],
  },
});
