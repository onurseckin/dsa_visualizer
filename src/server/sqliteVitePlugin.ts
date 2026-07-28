import type { Plugin } from "vite";
import { getAllState, setKeyValue, removeKeyValue, clearKeysByPrefix } from "./sqliteServer";
import { createApiHandler, createViteApiMiddleware } from "../../apps/api/src/http";

const viteStore = {
  getAll: getAllState,
  set: setKeyValue,
  delete: removeKeyValue,
  clearPrefix: clearKeysByPrefix,
};

export function sqliteVitePlugin(): Plugin {
  // Development and production intentionally share the Fetch API contract.
  // This adapter only bridges Vite's Connect middleware to that handler.
  const handleApi = createViteApiMiddleware(createApiHandler({ store: viteStore }));

  return {
    name: "vite-plugin-sqlite-storage",
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}
