import type { Plugin } from "vite";
import type { KeyValueStore } from "../../apps/api/src/persistence";
import { createApiHandler, createViteApiMiddleware } from "../../apps/api/src/http";
import { getSharedKeyValueStore } from "./sqliteServer";

export interface SqliteVitePluginOptions {
  readonly store?: KeyValueStore;
  readonly maxBodyBytes?: number;
}

export function sqliteVitePlugin(options: SqliteVitePluginOptions = {}): Plugin {
  // Development and production intentionally share the Fetch API contract.
  // This adapter only bridges Vite's Connect middleware to that handler.
  const store = options.store ?? getSharedKeyValueStore();
  const handleApi = createViteApiMiddleware(
    createApiHandler({ store, maxBodyBytes: options.maxBodyBytes }),
    options.maxBodyBytes,
  );

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
