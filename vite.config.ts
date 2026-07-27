/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
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
  },
});
