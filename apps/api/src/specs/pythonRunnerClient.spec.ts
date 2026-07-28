import type { PythonRunRequest, PythonRunResult } from "@dsa-visualizer/execution-contracts";
import { describe, expect, it, vi } from "vitest";

import { createPythonRunnerClient } from "../pythonRunnerClient";

const REQUEST: PythonRunRequest = {
  runId: "run-current",
  code: "def solve(value):\n    return value * 2",
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
        id: "double",
        label: "doubles",
        input: 2,
        expected: 4,
        comparison: "deep-equal",
      },
    ],
  },
};

const PASSED_RESULT: PythonRunResult = {
  runId: REQUEST.runId,
  status: "passed",
  stdout: "",
  stderr: "",
  cases: [
    {
      id: "double",
      status: "passed",
      stdout: "",
      stderr: "",
      durationMs: 2,
      actual: 4,
    },
  ],
  durationMs: 3,
  runtime: "server",
};

describe("Python runner client", () => {
  it("posts an explicit cancellation envelope", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createPythonRunnerClient({
      baseUrl: "http://runner.internal:8080/",
      fetch,
    });

    expect(client.cancel).toEqual(expect.any(Function));
    await client.cancel(REQUEST.runId);

    expect(fetch).toHaveBeenCalledWith(
      "http://runner.internal:8080/cancel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ runId: REQUEST.runId }),
      }),
    );
  });

  it("posts the shared request and accepts a normalized result", async () => {
    const fetch = vi.fn(async () => Response.json(PASSED_RESULT));
    const client = createPythonRunnerClient({
      baseUrl: "http://runner.internal:8080/",
      fetch,
      timeoutMs: 1_000,
    });

    await expect(client.run(REQUEST)).resolves.toEqual(PASSED_RESULT);
    expect(fetch).toHaveBeenCalledWith(
      "http://runner.internal:8080/run",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(REQUEST),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("normalizes an unavailable runner without leaking transport details", async () => {
    const client = createPythonRunnerClient({
      baseUrl: "http://runner.internal:8080",
      fetch: vi.fn(async () => {
        throw new TypeError("connect ECONNREFUSED 10.0.0.2");
      }),
    });

    const result = await client.run(REQUEST);

    expect(result).toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      runtime: "server",
      stderr: "Python runner is unavailable.",
      cases: [],
    });
  });

  it("aborts and normalizes a parent request timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      );
      const client = createPythonRunnerClient({
        baseUrl: "http://runner.internal:8080",
        fetch,
        timeoutMs: 50,
      });

      const pending = client.run(REQUEST);
      await vi.advanceTimersByTimeAsync(51);

      await expect(pending).resolves.toMatchObject({
        runId: REQUEST.runId,
        status: "timeout",
        stderr: "Python runner exceeded the 50 ms parent timeout.",
      });
      expect(fetch).toHaveBeenCalledWith(
        "http://runner.internal:8080/cancel",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ runId: REQUEST.runId }),
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ["HTTP failure", new Response("unavailable", { status: 503 })],
    ["non-JSON", new Response("{", { status: 200 })],
    [
      "wrong run ID",
      Response.json({
        ...PASSED_RESULT,
        runId: "run-stale",
      }),
    ],
    [
      "invalid result",
      Response.json({
        ...PASSED_RESULT,
        status: "complete",
      }),
    ],
  ])("normalizes an invalid runner response: %s", async (_label, response) => {
    const client = createPythonRunnerClient({
      baseUrl: "http://runner.internal:8080",
      fetch: vi.fn(async () => response),
    });

    await expect(client.run(REQUEST)).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      stderr: "Python runner returned an invalid response.",
    });
  });

  it("cancels a stale in-flight request through the caller signal", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const client = createPythonRunnerClient({
      baseUrl: "http://runner.internal:8080",
      fetch,
    });

    const pending = client.run(REQUEST, { signal: controller.signal });
    controller.abort();

    await expect(pending).resolves.toMatchObject({
      runId: REQUEST.runId,
      status: "error",
      stderr: "Python execution was cancelled.",
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://runner.internal:8080/cancel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ runId: REQUEST.runId }),
      }),
    );
  });

  it("does not cancel work after the runner response has completed", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const fetch = vi.fn(async () => Response.json(PASSED_RESULT));
      const client = createPythonRunnerClient({
        baseUrl: "http://runner.internal:8080",
        fetch,
        timeoutMs: 50,
      });

      await expect(client.run(REQUEST, { signal: controller.signal })).resolves.toEqual(
        PASSED_RESULT,
      );
      controller.abort();
      await vi.advanceTimersByTimeAsync(51);

      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
