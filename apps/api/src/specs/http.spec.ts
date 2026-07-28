import { validatePythonRunRequest } from "@dsa-visualizer/execution-contracts";
import { describe, expect, it, vi } from "vitest";

import { createApiHandler, createViteApiMiddleware } from "../http";
import { createMemoryKeyValueStore } from "../persistence";

const LOCAL_ORIGIN = "http://localhost:5173";

function handlerForTest() {
  return createApiHandler({ store: createMemoryKeyValueStore(), maxBodyBytes: 512 });
}

const PYTHON_REQUEST = {
  runId: "api-run",
  code: "def solve(value):\n    return value",
  spec: {
    runtime: "server",
    entrypoint: "solve",
    invocation: {
      kind: "function",
      arguments: [{ from: "input", path: [] }],
    },
    packages: [],
    cases: [
      {
        id: "identity",
        label: "identity",
        input: 1,
        expected: 1,
        comparison: "deep-equal",
      },
    ],
  },
} as const;

const DATABASE_BODY_LIMIT = 256 * 1024;
const PYTHON_BODY_LIMIT = 3 * 1024 * 1024;

function largeValidPythonRequest() {
  return {
    ...PYTHON_REQUEST,
    spec: {
      ...PYTHON_REQUEST.spec,
      limits: { maxInputBytes: 1024 * 1024 },
      cases: [
        {
          ...PYTHON_REQUEST.spec.cases[0],
          input: "x".repeat(DATABASE_BODY_LIMIT + 1),
        },
      ],
    },
  };
}

async function json(response: Response): Promise<unknown> {
  return response.json();
}

describe("API HTTP handler", () => {
  it("answers the health endpoint", async () => {
    const response = await handlerForTest()(new Request("http://api.local/api/health"));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true, service: "api" });
  });

  it("rejects bodies above the configured limit with a normalized error", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        body: JSON.stringify({ entries: { too_large: "x".repeat(600) } }),
      }),
    );

    expect(response.status).toBe(413);
    expect(await json(response)).toEqual({
      error: { code: "body_too_large", message: "Request body exceeds the 512 byte limit." },
    });
  });

  it("stops a chunked Fetch body at the limit before buffering the full request", async () => {
    const init = {
      method: "POST",
      body: byteStream(["x".repeat(300), "x".repeat(300)]),
      duplex: "half",
    } as RequestInit & { duplex: string };
    const request = new Request("http://api.local/api/db/state", {
      ...init,
    });

    const response = await handlerForTest()(request);
    expect(response.status).toBe(413);
    expect(await json(response)).toMatchObject({ error: { code: "body_too_large" } });
  });

  it("normalizes malformed JSON errors", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", { method: "POST", body: "{" }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: { code: "invalid_json", message: "Request body must be valid JSON." },
    });
  });

  it("validates and forwards a server Python run through the internal client", async () => {
    const run = vi.fn(async () => ({
      runId: "api-run",
      status: "passed" as const,
      stdout: "",
      stderr: "",
      cases: [],
      durationMs: 1,
      runtime: "server" as const,
    }));
    const handle = createApiHandler({
      store: createMemoryKeyValueStore(),
      pythonRunner: { run },
    });
    const response = await handle(
      new Request("http://api.local/api/python/run", {
        method: "POST",
        body: JSON.stringify(PYTHON_REQUEST),
      }),
    );

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({ runId: "api-run", status: "passed" });
    expect(run).toHaveBeenCalledWith(PYTHON_REQUEST, { signal: expect.any(AbortSignal) });
  });

  it("forwards a validator-valid Python request above the database body cap through Vite", async () => {
    const request = largeValidPythonRequest();
    expect(validatePythonRunRequest(request).ok).toBe(true);
    const run = vi.fn(async () => ({
      runId: request.runId,
      status: "passed" as const,
      stdout: "",
      stderr: "",
      cases: [],
      durationMs: 1,
      runtime: "server" as const,
    }));
    const handler = createApiHandler({
      store: createMemoryKeyValueStore(),
      maxBodyBytes: DATABASE_BODY_LIMIT,
      pythonRunner: { run },
    });
    const middleware = createViteApiMiddleware(handler, DATABASE_BODY_LIMIT);
    const response = nodeResponse();
    const body = JSON.stringify(request);
    const nodeRequest = nodeRequestFor("/api/python/run", body);

    await middleware(nodeRequest as never, response as never, () => undefined);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.ended[0] ?? "{}")).toMatchObject({ status: "passed" });
    expect(run).toHaveBeenCalledWith(request, { signal: expect.any(AbortSignal) });
  });

  it("rejects Python bodies above the Python route limit", async () => {
    const handle = createApiHandler({
      store: createMemoryKeyValueStore(),
      maxBodyBytes: DATABASE_BODY_LIMIT,
      pythonRunner: { run: vi.fn() },
    });
    const response = await handle(
      new Request("http://api.local/api/python/run", {
        method: "POST",
        body: "x".repeat(PYTHON_BODY_LIMIT + 1),
      }),
    );

    expect(response.status).toBe(413);
    expect(await json(response)).toEqual({
      error: {
        code: "body_too_large",
        message: `Request body exceeds the ${PYTHON_BODY_LIMIT} byte limit.`,
      },
    });
  });

  it("keeps the database route capped at 256 KiB", async () => {
    const handle = createApiHandler({
      store: createMemoryKeyValueStore(),
      maxBodyBytes: DATABASE_BODY_LIMIT,
    });
    const response = await handle(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        body: JSON.stringify({ entries: { oversized: "x".repeat(DATABASE_BODY_LIMIT) } }),
      }),
    );

    expect(response.status).toBe(413);
    expect(await json(response)).toMatchObject({ error: { code: "body_too_large" } });
  });

  it("rejects invalid, browser, and policy-exceeding Python requests before forwarding", async () => {
    const run = vi.fn();
    const handle = createApiHandler({
      store: createMemoryKeyValueStore(),
      pythonRunner: { run },
    });
    const values = [
      {},
      { ...PYTHON_REQUEST, spec: { ...PYTHON_REQUEST.spec, runtime: "browser" } },
      {
        ...PYTHON_REQUEST,
        spec: { ...PYTHON_REQUEST.spec, limits: { wallTimeMs: 30_001 } },
      },
    ];

    for (const value of values) {
      const response = await handle(
        new Request("http://api.local/api/python/run", {
          method: "POST",
          body: JSON.stringify(value),
        }),
      );
      expect(response.status).toBe(400);
      expect(await json(response)).toMatchObject({
        error: { code: "invalid_python_run", issues: expect.any(Array) },
      });
    }
    expect(run).not.toHaveBeenCalled();
  });

  it("requires POST and a configured Python runner for the run route", async () => {
    const handle = handlerForTest();
    const method = await handle(new Request("http://api.local/api/python/run"));
    const missing = await handle(
      new Request("http://api.local/api/python/run", {
        method: "POST",
        body: JSON.stringify(PYTHON_REQUEST),
      }),
    );

    expect(method.status).toBe(405);
    expect(method.headers.get("Allow")).toBe("POST");
    expect(missing.status).toBe(503);
    expect(await json(missing)).toMatchObject({ error: { code: "runner_unavailable" } });
  });

  it("gets, sets, batch sets, and deletes persisted state", async () => {
    const handle = handlerForTest();
    const headers = { "Content-Type": "application/json" };

    expect(
      await json(
        await handle(
          new Request("http://api.local/api/db/state", {
            method: "POST",
            headers,
            body: JSON.stringify({ key: "one", value: "1" }),
          }),
        ),
      ),
    ).toEqual({ ok: true });

    await handle(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        headers,
        body: JSON.stringify({ entries: { two: { value: 2 }, one: null } }),
      }),
    );

    const response = await handle(new Request("http://api.local/api/db/state"));
    expect(await json(response)).toEqual({ two: '{"value":2}' });
  });

  it("resets only the documented layout and trivia prefixes", async () => {
    const handle = handlerForTest();
    const headers = { "Content-Type": "application/json" };
    await handle(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        headers,
        body: JSON.stringify({
          entries: {
            dsa_visualizer_workspace_layout_v1: "layout",
            dsa_trivia_layout_v1: "trivia-layout",
            dsa_trivia_session_v1: "trivia-session",
            keep: "value",
          },
        }),
      }),
    );

    await handle(new Request("http://api.local/api/db/reset", { method: "POST" }));
    expect(await json(await handle(new Request("http://api.local/api/db/state")))).toEqual({
      dsa_trivia_session_v1: "trivia-session",
      keep: "value",
    });

    await handle(new Request("http://api.local/api/db/clear-trivia", { method: "POST" }));
    expect(await json(await handle(new Request("http://api.local/api/db/state")))).toEqual({
      keep: "value",
    });
  });

  it("rejects unsupported methods with an Allow header", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", { method: "DELETE" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
    expect(await json(response)).toEqual({
      error: {
        code: "method_not_allowed",
        message: "Method DELETE is not allowed for this route.",
      },
    });
  });

  it("allows localhost CORS preflights and rejects untrusted origins", async () => {
    const handle = handlerForTest();
    const allowed = await handle(
      new Request("http://api.local/api/db/state", {
        method: "OPTIONS",
        headers: { Origin: LOCAL_ORIGIN, "Access-Control-Request-Method": "POST" },
      }),
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(LOCAL_ORIGIN);

    const denied = await handle(
      new Request("http://api.local/api/health", { headers: { Origin: "https://example.com" } }),
    );
    expect(denied.status).toBe(403);
    expect(await json(denied)).toEqual({
      error: { code: "origin_not_allowed", message: "This origin is not allowed." },
    });
  });

  it.each([
    ["getAll", new Request("http://api.local/api/db/state")],
    [
      "set",
      new Request("http://api.local/api/db/state", {
        method: "POST",
        body: JSON.stringify({ key: "one", value: "1" }),
      }),
    ],
    ["clearPrefix", new Request("http://api.local/api/db/reset", { method: "POST" })],
  ] as const)("normalizes store %s failures", async (method, request) => {
    const store = createMemoryKeyValueStore();
    Object.assign(store, {
      [method]: () => {
        throw new Error("storage failed");
      },
    });
    const response = await createApiHandler({ store })(request);

    expect(response.status).toBe(500);
    expect(await json(response)).toEqual({
      error: { code: "internal_error", message: "Unexpected API error." },
    });
  });

  it("returns a 413 response for a capped Connect stream without waiting for an end event", async () => {
    const middleware = createViteApiMiddleware(handlerForTest(), 512);
    const ended: string[] = [];
    const listeners = new Map<string, (chunk?: string) => void>();
    const response = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (body: Buffer) => ended.push(body.toString()),
    };
    const request = {
      url: "/api/db/state",
      method: "POST",
      headers: {},
      on: (event: string, listener: (chunk?: string) => void) => {
        listeners.set(event, listener);
        if (event === "error") {
          setTimeout(() => listeners.get("data")?.("x".repeat(600)), 0);
        }
      },
      resume: () => undefined,
    };

    await middleware(request as never, response as never, () => undefined);

    expect(response.statusCode).toBe(413);
    expect(JSON.parse(ended[0] ?? "{}")).toMatchObject({ error: { code: "body_too_large" } });
  });
});

function byteStream(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

function nodeResponse() {
  const ended: string[] = [];
  return {
    ended,
    statusCode: 0,
    setHeader: () => undefined,
    end: (body: Buffer) => ended.push(body.toString()),
  };
}

function nodeRequestFor(url: string, body: string) {
  const listeners = new Map<string, (chunk?: string) => void>();
  return {
    url,
    method: "POST",
    headers: {},
    on: (event: string, listener: (chunk?: string) => void) => {
      listeners.set(event, listener);
      if (event === "error") {
        setTimeout(() => {
          listeners.get("data")?.(body);
          listeners.get("end")?.();
        }, 0);
      }
    },
    resume: () => undefined,
  };
}
