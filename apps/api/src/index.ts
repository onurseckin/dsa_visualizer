import type { ApiConfig } from "./config";
import { readApiConfig } from "./config";
import { createApiHandler, type ApiHandler } from "./http";
import {
  createSqliteKeyValueStore,
  type KeyValueStore,
  type SqliteKeyValueStoreOptions,
} from "./persistence";
import { createPythonRunnerClient } from "./pythonRunnerClient";

type ShutdownSignal = "SIGTERM" | "SIGINT";

interface BunServer {
  stop(closeConnections?: boolean): void;
}

interface BunServeOptions {
  readonly hostname: string;
  readonly port: number;
  readonly fetch: ApiHandler;
}

interface ShutdownProcess {
  once(signal: ShutdownSignal, listener: () => void): unknown;
  removeListener(signal: ShutdownSignal, listener: () => void): unknown;
}

export interface ApiServerDependencies {
  readonly readConfig?: () => ApiConfig;
  readonly createStore?: (options: SqliteKeyValueStoreOptions) => KeyValueStore;
  readonly createHandler?: typeof createApiHandler;
  readonly serve?: (options: BunServeOptions) => BunServer;
  readonly process?: ShutdownProcess;
}

export interface RunningApiServer {
  stop(closeConnections?: boolean): void;
}

const SHUTDOWN_SIGNALS: readonly ShutdownSignal[] = ["SIGTERM", "SIGINT"];

export function startApiServer(dependencies: ApiServerDependencies = {}): RunningApiServer {
  const config = (dependencies.readConfig ?? readApiConfig)();
  const store = (dependencies.createStore ?? createSqliteKeyValueStore)({
    dataDirectory: config.dataDirectory,
  });
  const fetch = (dependencies.createHandler ?? createApiHandler)({
    store,
    maxBodyBytes: config.maxBodyBytes,
    allowedOrigins: config.allowedOrigins,
    pythonRunner: createPythonRunnerClient({
      baseUrl: config.pythonRunnerUrl,
      timeoutMs: config.pythonRunnerTimeoutMs,
    }),
  });
  const server = (dependencies.serve ?? serveWithBun)({
    hostname: config.host,
    port: config.port,
    fetch,
  });
  const shutdownProcess = dependencies.process ?? process;
  let closed = false;
  const stop = (closeConnections = true) => {
    if (closed) return;
    closed = true;
    for (const signal of SHUTDOWN_SIGNALS) shutdownProcess.removeListener(signal, stop);
    server.stop(closeConnections);
    store.close?.();
  };

  for (const signal of SHUTDOWN_SIGNALS) shutdownProcess.once(signal, stop);
  return { stop };
}

function serveWithBun(options: BunServeOptions): BunServer {
  const bun = (globalThis as { Bun?: { serve?: (options: BunServeOptions) => BunServer } }).Bun;
  if (!bun?.serve) throw new Error("The local API service must run with Bun.");
  return bun.serve(options);
}

if ((import.meta as ImportMeta & { main?: boolean }).main) startApiServer();
