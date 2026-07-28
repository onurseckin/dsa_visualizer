import { describe, expect, it, vi } from "vitest";

import { startApiServer } from "../index";
import { createMemoryKeyValueStore } from "../persistence";

function harness() {
  const store = createMemoryKeyValueStore();
  const close = vi.fn();
  store.close = close;
  const stop = vi.fn();
  const serve = vi.fn(() => ({ stop }));
  const listeners = new Map<string, () => void>();
  const processPort = {
    once: vi.fn((signal: string, listener: () => void) => listeners.set(signal, listener)),
    removeListener: vi.fn((signal: string, listener: () => void) => {
      if (listeners.get(signal) === listener) listeners.delete(signal);
    }),
  };
  const createStore = vi.fn(() => store);

  const api = startApiServer({
    readConfig: () => ({
      host: "127.0.0.1",
      port: 4123,
      dataDirectory: "/tmp/dsa-api",
      maxBodyBytes: 123,
      allowedOrigins: ["http://localhost:5173"],
      pythonRunnerUrl: "http://runner.internal:8080",
      pythonRunnerTimeoutMs: 456,
    }),
    createStore,
    serve,
    process: processPort,
  });

  return { api, close, createStore, listeners, processPort, serve, stop };
}

describe("startApiServer", () => {
  it("uses Bun.serve by default without binding a real port", () => {
    const store = createMemoryKeyValueStore();
    const stop = vi.fn();
    const serve = vi.fn(() => ({ stop }));
    const listeners = new Map<string, () => void>();
    vi.stubGlobal("Bun", { serve });

    try {
      const api = startApiServer({
        readConfig: () => ({
          host: "127.0.0.1",
          port: 4123,
          dataDirectory: undefined,
          maxBodyBytes: 123,
          allowedOrigins: [],
          pythonRunnerUrl: "http://runner.internal:8080",
          pythonRunnerTimeoutMs: 456,
        }),
        createStore: () => store,
        process: {
          once: (signal, listener) => listeners.set(signal, listener),
          removeListener: (signal, listener) => {
            if (listeners.get(signal) === listener) listeners.delete(signal);
          },
        },
      });

      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({ hostname: "127.0.0.1", port: 4123, fetch: expect.any(Function) }),
      );
      api.stop();
      expect(stop).toHaveBeenCalledWith(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("wires config, store, handler, and Bun.serve without binding a real port", async () => {
    const { api, createStore, serve, stop } = harness();

    expect(createStore).toHaveBeenCalledWith({ dataDirectory: "/tmp/dsa-api" });
    expect(serve).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: "127.0.0.1", port: 4123, fetch: expect.any(Function) }),
    );
    const options = serve.mock.calls[0]?.[0];
    expect(await options.fetch(new Request("http://api.local/api/health"))).toMatchObject({
      status: 200,
    });

    api.stop(false);
    expect(stop).toHaveBeenCalledWith(false);
  });

  it("handles SIGTERM once, closes resources, and removes both shutdown listeners", () => {
    const { close, listeners, processPort, stop } = harness();

    expect(processPort.once).toHaveBeenCalledTimes(2);
    listeners.get("SIGTERM")?.();

    expect(stop).toHaveBeenCalledWith(true);
    expect(close).toHaveBeenCalledTimes(1);
    expect(processPort.removeListener).toHaveBeenCalledTimes(2);
    expect(listeners.size).toBe(0);
  });

  it("makes manual stop idempotent and leaves no SIGINT listener behind", () => {
    const { api, close, listeners, processPort, stop } = harness();

    api.stop();
    api.stop();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(processPort.removeListener).toHaveBeenCalledTimes(2);
    expect(listeners.has("SIGINT")).toBe(false);
  });
});
