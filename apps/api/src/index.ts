import { readApiConfig } from "./config";
import { createApiHandler } from "./http";
import { createSqliteKeyValueStore } from "./persistence";

export interface RunningApiServer {
  stop(closeConnections?: boolean): void;
}

export function startApiServer(): RunningApiServer {
  const config = readApiConfig();
  const store = createSqliteKeyValueStore({ dataDirectory: config.dataDirectory });
  const fetch = createApiHandler({
    store,
    maxBodyBytes: config.maxBodyBytes,
    allowedOrigins: config.allowedOrigins,
  });
  const server = Bun.serve({ hostname: config.host, port: config.port, fetch });
  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    server.stop(true);
    store.close?.();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  return { stop };
}

if ((import.meta as ImportMeta & { main?: boolean }).main) startApiServer();
