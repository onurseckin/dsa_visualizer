import { describe, expect, it, vi } from "vitest";
import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import {
  createServerPythonRunnerClient,
  type ServerPythonRunnerClientOptions,
} from "../serverRunnerClient";

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends object ? Mutable<T[Key]> : T[Key];
};

const SPEC: PythonExecutionSpec = {
  runtime: "browser",
  entrypoint: "solve",
  invocation: {
    kind: "function",
    arguments: [{ from: "input", path: [] }],
  },
  packages: [],
  limits: {
    maxOutputBytes: 16,
    maxResultBytes: 16,
  },
  cases: [
    {
      id: "public",
      label: "Public",
      input: 2,
      expected: 4,
      comparison: "deep-equal",
    },
  ],
};

const REQUEST: PythonRunRequest = {
  runId: "run-server-browser",
  code: "def solve(value):\n    return value * 2",
  spec: SPEC,
};

const RESULT: PythonRunResult = {
  runId: "transport-1",
  status: "passed",
  stdout: "",
  stderr: "",
  cases: [
    {
      id: "public",
      status: "passed",
      stdout: "",
      stderr: "",
      durationMs: 1,
      actual: 4,
    },
  ],
  durationMs: 2,
  runtime: "server",
};

const LOGICAL_RESULT: PythonRunResult = {
  ...RESULT,
  runId: REQUEST.runId,
};

function createTestServerClient(
  options: ServerPythonRunnerClientOptions = {},
  executionIds = ["transport-1", "transport-2"],
) {
  let index = 0;
  return createServerPythonRunnerClient({
    ...options,
    executionIdFactory:
      options.executionIdFactory ?? (() => executionIds[index++] ?? `transport-${index}`),
  });
}

describe("browser-to-server runner client", () => {
  it("posts a cloned server contract without mutating the authored browser spec", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(RESULT));
    const client = createTestServerClient({ fetch });

    await expect(client.run(REQUEST)).resolves.toEqual(LOGICAL_RESULT);

    const body = JSON.parse(
      String((fetch.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as PythonRunRequest;
    expect(fetch).toHaveBeenCalledWith(
      "/api/python/run",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(body.spec.runtime).toBe("server");
    expect(REQUEST.spec.runtime).toBe("browser");
  });

  it.each([
    [
      "an unavailable API",
      vi.fn(async () => {
        throw new TypeError("network details must not leak");
      }),
      "Python runner is unavailable.",
    ],
    [
      "a non-JSON response",
      vi.fn(async () => new Response("{", { status: 200 })),
      "Python runner returned an invalid response.",
    ],
    [
      "a mismatched run ID",
      vi.fn(async () => Response.json({ ...RESULT, runId: "stale" })),
      "Python runner returned an invalid response.",
    ],
    [
      "an unknown case",
      vi.fn(async () =>
        Response.json({
          ...RESULT,
          cases: [{ ...RESULT.cases[0], id: "hidden" }],
        }),
      ),
      "Python runner returned an invalid response.",
    ],
    [
      "duplicate cases",
      vi.fn(async () =>
        Response.json({
          ...RESULT,
          cases: [RESULT.cases[0], RESULT.cases[0]],
        }),
      ),
      "Python runner returned an invalid response.",
    ],
    [
      "non-aggregate output",
      vi.fn(async () => Response.json({ ...RESULT, stdout: "not-the-case-stream" })),
      "Python runner returned an invalid response.",
    ],
    [
      "an inconsistent status",
      vi.fn(async () => Response.json({ ...RESULT, status: "failed" })),
      "Python runner returned an invalid response.",
    ],
    [
      "oversized output",
      vi.fn(async () => {
        const output = "x".repeat(17);
        return Response.json({
          ...RESULT,
          stdout: output,
          cases: [{ ...RESULT.cases[0], stdout: output }],
        });
      }),
      "Python runner returned an invalid response.",
    ],
    [
      "an oversized actual result",
      vi.fn(async () =>
        Response.json({
          ...RESULT,
          cases: [{ ...RESULT.cases[0], actual: "x".repeat(15) }],
        }),
      ),
      "Python runner returned an invalid response.",
    ],
    [
      "an unknown response property",
      vi.fn(async () => Response.json({ ...RESULT, internal: "leak" })),
      "Python runner returned an invalid response.",
    ],
  ])("normalizes %s", async (_label, fetch, stderr) => {
    const client = createTestServerClient({ fetch });

    await expect(client.run(REQUEST)).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      runtime: "server",
      stderr,
    });
  });

  it("rejects an invalid cloned request before starting network work", async () => {
    const fetch = vi.fn(async () => Response.json(RESULT));
    const client = createTestServerClient({ fetch });
    const invalidRequest = {
      ...REQUEST,
      spec: {
        ...REQUEST.spec,
        limits: {
          ...REQUEST.spec.limits,
          maxSourceBytes: 4,
        },
      },
    };

    await expect(client.run(invalidRequest)).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      runtime: "server",
      stderr: "Python execution request is invalid.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [400, "Python runner returned an invalid response."],
    [503, "Python runner is unavailable."],
  ])("normalizes an HTTP %i response", async (status, stderr) => {
    const client = createTestServerClient({
      fetch: vi.fn(async () => new Response("failure", { status })),
    });

    await expect(client.run(REQUEST)).resolves.toMatchObject({
      status: "error",
      stderr,
    });
  });

  it("honors a signal that was already aborted before the run starts", async () => {
    const fetch = vi.fn(async () => Response.json(RESULT));
    const controller = new AbortController();
    controller.abort();
    const client = createTestServerClient({ fetch });

    await expect(client.run(REQUEST, { signal: controller.signal })).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      "/api/python/cancel",
      expect.objectContaining({ body: JSON.stringify({ runId: "transport-1" }) }),
    );
  });

  it("aborts timed-out work and recreates request state for the next run", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((resolve, reject) => {
            if (_url === "/api/python/cancel") {
              resolve(new Response(null, { status: 200 }));
              return;
            }
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      );
      const client = createTestServerClient({ fetch, timeoutMs: 50 });

      const pending = client.run(REQUEST);
      await vi.advanceTimersByTimeAsync(51);

      await expect(pending).resolves.toMatchObject({
        status: "timeout",
        stderr: "Python runner exceeded the 50 ms request timeout.",
      });
      expect(fetch).toHaveBeenCalledWith(
        "/api/python/cancel",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ runId: "transport-1" }),
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels stale work when a newer run starts and suppresses its late response", async () => {
    const responses = new Map<string, (response: Response) => void>();
    const fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/python/cancel") return Promise.resolve(new Response(null));
      const body = JSON.parse(String(init?.body)) as PythonRunRequest;
      return new Promise<Response>((resolve) => responses.set(body.runId, resolve));
    });
    const client = createTestServerClient({ fetch });

    const stale = client.run(REQUEST);
    const currentRequest = { ...REQUEST, runId: "run-current" };
    const current = client.run(currentRequest);

    await expect(stale).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was superseded by a newer run.",
    });
    responses.get("transport-1")?.(Response.json(RESULT));
    responses.get("transport-2")?.(Response.json({ ...RESULT, runId: "transport-2" }));
    await expect(current).resolves.toMatchObject({
      runId: currentRequest.runId,
      status: "passed",
    });
  });

  it("uses AbortController for caller cancellation and exposes explicit cancel", async () => {
    const fetch = vi.fn(
      (url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          if (url === "/api/python/cancel") {
            resolve(new Response(null));
            return;
          }
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const controller = new AbortController();
    const client = createTestServerClient({ fetch });

    const pending = client.run(REQUEST, { signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });

    await client.cancel("another-run");
    expect(fetch).toHaveBeenCalledWith(
      "/api/python/cancel",
      expect.objectContaining({
        body: JSON.stringify({ runId: "transport-1" }),
      }),
    );
    expect(fetch.mock.calls.filter(([url]) => url === "/api/python/cancel")).toHaveLength(1);
  });

  it("supports explicit cancellation and disposal of active work", async () => {
    const fetch = vi.fn(
      (url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          if (url === "/api/python/cancel") {
            resolve(new Response(null));
            return;
          }
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const client = createTestServerClient({ fetch });

    const cancelled = client.run(REQUEST);
    await client.cancel(REQUEST.runId);
    await expect(cancelled).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });

    const disposed = client.run({ ...REQUEST, runId: "run-disposed" });
    client.dispose();
    await expect(disposed).resolves.toMatchObject({
      runId: "run-disposed",
      status: "error",
      stderr: "Python execution was cancelled.",
    });
    client.dispose();
  });

  it("contains failures from best-effort cancellation requests", async () => {
    const fetch = vi.fn((url: string) =>
      url === "/api/python/cancel"
        ? Promise.reject(new TypeError("runner stopped"))
        : new Promise<Response>(() => undefined),
    );
    const client = createTestServerClient({ fetch });

    const pending = client.run(REQUEST);
    await client.cancel(REQUEST.runId);

    await expect(pending).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });
  });

  it("dispatches and validates against a deep request snapshot", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetch = vi.fn(
      (_url: string, _init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const mutableRequest = structuredClone(REQUEST) as Mutable<PythonRunRequest>;
    const client = createServerPythonRunnerClient({
      fetch,
      executionIdFactory: () => "transport-snapshot",
    });

    const pending = client.run(mutableRequest);
    mutableRequest.runId = "mutated-logical-id";
    mutableRequest.code = "raise RuntimeError('mutated')";
    mutableRequest.spec.cases[0]!.id = "mutated-case";
    mutableRequest.spec.cases[0]!.input = 99;
    mutableRequest.spec.cases[0]!.expected = 198;
    (mutableRequest.spec.limits as { maxOutputBytes: number }).maxOutputBytes = 1;

    const body = JSON.parse(
      String((fetch.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as PythonRunRequest;
    expect(body).toMatchObject({
      runId: "transport-snapshot",
      code: REQUEST.code,
      spec: {
        runtime: "server",
        cases: [
          {
            id: "public",
            input: 2,
            expected: 4,
          },
        ],
        limits: {
          maxOutputBytes: 16,
        },
      },
    });

    resolveResponse?.(Response.json({ ...RESULT, runId: "transport-snapshot" }));
    await expect(pending).resolves.toEqual(LOGICAL_RESULT);
  });

  it("uses a distinct transport ID and remaps a validated result to the logical ID", async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as PythonRunRequest;
      return Response.json({ ...RESULT, runId: body.runId });
    });
    const client = createServerPythonRunnerClient({
      fetch,
      executionIdFactory: () => "transport-remap",
    });

    await expect(client.run(REQUEST)).resolves.toEqual(LOGICAL_RESULT);

    const body = JSON.parse(
      String((fetch.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as PythonRunRequest;
    expect(body.runId).toBe("transport-remap");
    expect(body.runId).not.toBe(REQUEST.runId);
  });

  it("does not create cancellation tombstones for inactive logical IDs", async () => {
    const fetch = vi.fn(async () => new Response(null));
    const client = createServerPythonRunnerClient({ fetch });

    await client.cancel("inactive-logical-id");

    expect(fetch).not.toHaveBeenCalled();
  });

  it("cancels only the old transport when the same logical ID is rapidly replaced", async () => {
    const executionIds = ["transport-old", "transport-new"];
    const responses = new Map<string, (response: Response) => void>();
    const cancelledIds: string[] = [];
    const fetch = vi.fn((url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { runId: string };
      if (url === "/api/python/cancel") {
        cancelledIds.push(body.runId);
        return Promise.resolve(new Response(null));
      }
      return new Promise<Response>((resolve) => responses.set(body.runId, resolve));
    });
    const client = createServerPythonRunnerClient({
      fetch,
      executionIdFactory: () => executionIds.shift()!,
    });

    const stale = client.run(REQUEST);
    const current = client.run(REQUEST);

    await expect(stale).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      stderr: "Python execution was superseded by a newer run.",
    });
    expect(cancelledIds).toEqual(["transport-old"]);

    responses.get("transport-old")?.(Response.json({ ...RESULT, runId: "transport-old" }));
    responses.get("transport-new")?.(Response.json({ ...RESULT, runId: "transport-new" }));
    await expect(current).resolves.toEqual(LOGICAL_RESULT);
    expect(cancelledIds).toEqual(["transport-old"]);
  });
});
