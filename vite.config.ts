/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { sqliteVitePlugin } from "./src/server/sqliteVitePlugin";

export default defineConfig({
  plugins: [
    // Owns the same Fetch API handler used by apps/api in Docker production.
    sqliteVitePlugin(),
    // Router plugin must precede the React plugin — wrong order fails silently.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      /* A route's spec lives next to it under src/routes/**\/specs, and the plugin
         would otherwise warn on every run that the spec exports no Route. Keep this
         in sync with tsr.config.json, which the `generate-routes` CLI reads instead. */
      routeFileIgnorePattern: "\\.spec\\.tsx?$",
    }),
    tailwindcss(),
    react(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}", "apps/api/src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.spec.{ts,tsx}",
        "src/**/specs/**",
        "src/test/**",
        "src/routeTree.gen.ts",
        // Bun process entrypoint; its behavior is covered by the Docker/API smoke
        // check while all reusable API modules remain under the per-file gate.
        "apps/api/src/index.ts",
      ],
      reporter: ["text", "json", "html"],
      thresholds: {
        // These are repository floors, not targets. Raise them with coverage;
        // never lower them to make a change pass.
        statements: 98,
        branches: 89,
        functions: 97,
        lines: 98,
      },
    },
  },
});
