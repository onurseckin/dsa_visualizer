import type { Plugin, Connect } from "vite";
import { getAllState, setKeyValue, removeKeyValue, clearKeysByPrefix } from "./sqliteServer";

export function sqliteVitePlugin(): Plugin {
  const handleApi = (
    req: Connect.IncomingMessage,
    res: import("http").ServerResponse,
    next: Connect.NextFunction,
  ) => {
    const url = req.url || "";
    if (!url.startsWith("/api/db")) {
      return next();
    }

    if (req.method === "GET" && url === "/api/db/state") {
      const state = getAllState();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(state));
      return;
    }

    if (req.method === "POST") {
      let bodyStr = "";
      req.on("data", (chunk) => {
        bodyStr += chunk;
      });
      req.on("end", () => {
        try {
          const body = JSON.parse(bodyStr || "{}");
          if (url === "/api/db/state") {
            if (body.key !== undefined) {
              if (body.value === null || body.value === undefined) {
                removeKeyValue(body.key);
              } else {
                setKeyValue(
                  body.key,
                  typeof body.value === "string" ? body.value : JSON.stringify(body.value),
                );
              }
            } else if (body.entries && typeof body.entries === "object") {
              for (const [k, v] of Object.entries(body.entries)) {
                if (v === null || v === undefined) {
                  removeKeyValue(k);
                } else {
                  setKeyValue(k, typeof v === "string" ? v : JSON.stringify(v));
                }
              }
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (url === "/api/db/reset") {
            clearKeysByPrefix("dsa_visualizer_workspace_layout");
            clearKeysByPrefix("dsa_trivia_layout");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (url === "/api/db/clear-trivia") {
            clearKeysByPrefix("dsa_trivia");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          }
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: String(e) }));
          return;
        }
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      });
      return;
    }

    next();
  };

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
