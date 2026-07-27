import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connect } from "vite";
import { clearKeysByPrefix, getAllState, removeKeyValue, setKeyValue } from "../sqliteServer";
import { sqliteVitePlugin } from "../sqliteVitePlugin";

describe("sqliteServer and sqliteVitePlugin", () => {
  afterEach(() => {
    clearKeysByPrefix("test_");
    vi.restoreAllMocks();
  });

  it("sets, gets, removes and clears keys", () => {
    setKeyValue("test_key1", "val1");
    setKeyValue("test_key2", "val2");

    const state = getAllState();
    expect(state["test_key1"]).toBe("val1");
    expect(state["test_key2"]).toBe("val2");

    removeKeyValue("test_key1");
    expect(getAllState()["test_key1"]).toBeUndefined();

    clearKeysByPrefix("test_");
    expect(getAllState()["test_key2"]).toBeUndefined();
  });

  it("handles GET and POST requests in sqliteVitePlugin middleware", async () => {
    const plugin = sqliteVitePlugin();
    const req = {
      url: "/api/db/state",
      method: "GET",
    } as unknown as Connect.IncomingMessage;

    const headers: Record<string, string> = {};
    let bodyEnded = "";

    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      end: (data: string) => {
        bodyEnded = data;
      },
    } as unknown as import("http").ServerResponse;

    const next = vi.fn();

    const mockDevServer = {
      middlewares: {
        use: (handler: Connect.NextHandleFunction) => {
          handler(req, res, next);
        },
      },
    };

    if (typeof plugin.configureServer === "function") {
      plugin.configureServer(mockDevServer as unknown as import("vite").ViteDevServer);
    }

    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(bodyEnded)).toBeDefined();

    // Test POST state
    setKeyValue("test_p1", "v1");
    const postReq = {
      url: "/api/db/state",
      method: "POST",
      on: (event: string, cb: (chunk?: string) => void) => {
        if (event === "data") cb(JSON.stringify({ key: "test_p1", value: "v2" }));
        if (event === "end") cb();
      },
    } as unknown as Connect.IncomingMessage;

    const postRes = {
      setHeader: vi.fn(),
      end: vi.fn(),
    } as unknown as import("http").ServerResponse;

    const mockPreviewServer = {
      middlewares: {
        use: (handler: Connect.NextHandleFunction) => {
          handler(postReq, postRes, next);
        },
      },
    };

    if (typeof plugin.configurePreviewServer === "function") {
      plugin.configurePreviewServer(mockPreviewServer as unknown as import("vite").PreviewServer);
    }

    expect(getAllState()["test_p1"]).toBe("v2");

    // Test POST reset
    const resetReq = {
      url: "/api/db/reset",
      method: "POST",
      on: (event: string, cb: (chunk?: string) => void) => {
        if (event === "data") cb(JSON.stringify({}));
        if (event === "end") cb();
      },
    } as unknown as Connect.IncomingMessage;

    const resetRes = {
      setHeader: vi.fn(),
      end: vi.fn(),
    } as unknown as import("http").ServerResponse;

    const mockResetServer = {
      middlewares: {
        use: (handler: Connect.NextHandleFunction) => {
          handler(resetReq, resetRes, next);
        },
      },
    };

    if (typeof plugin.configureServer === "function") {
      plugin.configureServer(mockResetServer as unknown as import("vite").ViteDevServer);
    }

    // Test non-matching URL falls through to next()
    const otherReq = {
      url: "/other",
      method: "GET",
    } as unknown as Connect.IncomingMessage;

    const mockOtherServer = {
      middlewares: {
        use: (handler: Connect.NextHandleFunction) => {
          handler(otherReq, res, next);
        },
      },
    };

    if (typeof plugin.configureServer === "function") {
      plugin.configureServer(mockOtherServer as unknown as import("vite").ViteDevServer);
    }

    expect(next).toHaveBeenCalled();
  });
});
