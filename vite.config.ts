import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
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
    ...(process.env.VITE_USE_DOCKER_API === "1" ? [] : [sqliteVitePlugin()]),
    // Router plugin must precede the React plugin — wrong order fails silently.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
  ],
  server:
    process.env.VITE_USE_DOCKER_API === "1" ? { proxy: { "/api": "http://api:3000" } } : undefined,
});
