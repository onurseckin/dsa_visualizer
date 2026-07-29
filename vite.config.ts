/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { configDefaults } from "vitest/config";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sqliteVitePlugin } from "./src/server/sqliteVitePlugin";

const PYODIDE_COPY_EXCLUDES = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/pyodide/node_modules",
];

function viteStaticCopyPyodide() {
  const pyodideDirectory = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDirectory, "*").replace(/\\/g, "/")].concat(PYODIDE_COPY_EXCLUDES),
        dest: "assets/pyodide/314.0.3",
      },
    ],
  });
}

export default defineConfig({
  optimizeDeps: { exclude: ["pyodide"] },
  worker: { format: "es" },
  plugins: [
    ...viteStaticCopyPyodide(),
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
    exclude: [...configDefaults.exclude, "e2e/**"],
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
