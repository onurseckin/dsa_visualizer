import { describe, expect, it, vi } from "vitest";
import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { createServerPythonRunnerClient } from "../serverRunnerClient";

const SPEC: PythonExecutionSpec = {
  runtime: "browser",
  entrypoint: "solve",
  invocation: {
    kind: "function",
    arguments: [{ from: "input", path: [] }],
  },
  packages: [],
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
  runId: REQUEST.runId,
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

describe("browser-to-server runner client", () => {
  it("posts a cloned server contract without mutating the authored browser spec", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(RESULT));
    const client = createServerPythonRunnerClient({ fetch });

    await expect(client.run(REQUEST)).resolves.toEqual(RESULT);

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
  ])("normalizes %s", async (_label, fetch, stderr) => {
    const client = createServerPythonRunnerClient({ fetch });

    await expect(client.run(REQUEST)).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      runtime: "server",
      stderr,
    });
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
      const client = createServerPythonRunnerClient({ fetch, timeoutMs: 50 });

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
          body: JSON.stringify({ runId: REQUEST.runId }),
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
    const client = createServerPythonRunnerClient({ fetch });

    const stale = client.run(REQUEST);
    const currentRequest = { ...REQUEST, runId: "run-current" };
    const current = client.run(currentRequest);

    await expect(stale).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was superseded by a newer run.",
    });
    responses.get(REQUEST.runId)?.(Response.json(RESULT));
    responses.get(currentRequest.runId)?.(
      Response.json({ ...RESULT, runId: currentRequest.runId }),
    );
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
    const client = createServerPythonRunnerClient({ fetch });

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
        body: JSON.stringify({ runId: "another-run" }),
      }),
    );
  });
});
