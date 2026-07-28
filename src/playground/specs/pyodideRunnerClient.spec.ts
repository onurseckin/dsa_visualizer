import { execFileSync } from "node:child_process";

import { describe, expect, it, vi } from "vitest";
import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { createPyodideRunnerClient, type PyodideWorkerLike } from "../pyodideRunnerClient";
import {
  BROWSER_EXECUTION_HARNESS,
  executePythonRequestInPyodide,
  PYODIDE_PACKAGE_BASE_URL,
  PYODIDE_VERSION,
} from "../pyodideRunner.worker";

function executionSpec(overrides: Partial<PythonExecutionSpec> = {}): PythonExecutionSpec {
  return {
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
    limits: { wallTimeMs: 50 },
    ...overrides,
  };
}

function request(
  runId = "run-browser",
  overrides: Partial<PythonRunRequest> = {},
): PythonRunRequest {
  return {
    runId,
    code: "def solve(value):\n    return value * 2",
    spec: executionSpec(),
    ...overrides,
  };
}

function result(runId = "run-browser"): PythonRunResult {
  return {
    runId,
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
    runtime: "browser",
  };
}

class FakeWorker extends EventTarget implements PyodideWorkerLike {
  readonly postMessage = vi.fn();
  readonly terminate = vi.fn();

  emitResult(value: PythonRunResult): void {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "result", runId: value.runId, result: value },
      }),
    );
  }

  emitError(): void {
    this.dispatchEvent(new Event("error"));
  }
}

describe("Pyodide runner client", () => {
  it("constructs a module worker lazily and posts the shared request", async () => {
    const workers: FakeWorker[] = [];
    const createWorker = vi.fn(() => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const client = createPyodideRunnerClient({ createWorker });

    expect(createWorker).not.toHaveBeenCalled();
    const pending = client.run(request());
    expect(createWorker).toHaveBeenCalledOnce();
    expect(workers[0]?.postMessage).toHaveBeenCalledWith({
      type: "run",
      request: request(),
    });

    workers[0]?.emitResult(result());
    await expect(pending).resolves.toEqual(result());
  });

  it("terminates a timed-out worker and recreates it for the next run", async () => {
    vi.useFakeTimers();
    try {
      const workers: FakeWorker[] = [];
      const client = createPyodideRunnerClient({
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker;
        },
      });

      const timedOut = client.run(request());
      await vi.advanceTimersByTimeAsync(51);
      await expect(timedOut).resolves.toMatchObject({
        runId: "run-browser",
        status: "timeout",
        runtime: "browser",
      });
      expect(workers[0]?.terminate).toHaveBeenCalledOnce();

      const next = client.run(request("run-next"));
      expect(workers).toHaveLength(2);
      workers[1]?.emitResult(result("run-next"));
      await expect(next).resolves.toMatchObject({ runId: "run-next", status: "passed" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("terminates on cancellation and suppresses stale results from the old worker", async () => {
    const workers: FakeWorker[] = [];
    const client = createPyodideRunnerClient({
      createWorker: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
    });

    const stale = client.run(request("run-stale"));
    const current = client.run(request("run-current"));

    await expect(stale).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was superseded by a newer run.",
    });
    expect(workers[0]?.terminate).toHaveBeenCalledOnce();

    workers[0]?.emitResult(result("run-stale"));
    workers[1]?.emitResult(result("run-current"));
    await expect(current).resolves.toMatchObject({
      runId: "run-current",
      status: "passed",
    });

    const cancelled = client.run(request("run-cancelled"));
    await client.cancel("run-cancelled");
    await expect(cancelled).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });
    expect(workers[1]?.terminate).toHaveBeenCalledOnce();
  });

  it("normalizes worker errors and invalid or mismatched messages", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      const client = createPyodideRunnerClient({ createWorker: () => worker });

      const failed = client.run(request());
      worker.emitError();
      await expect(failed).resolves.toMatchObject({
        status: "error",
        stderr: "Browser Python runtime is unavailable.",
      });
      expect(worker.terminate).toHaveBeenCalledOnce();

      const nextWorker = new FakeWorker();
      const nextClient = createPyodideRunnerClient({ createWorker: () => nextWorker });
      const pending = nextClient.run(request());
      nextWorker.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "result", runId: "wrong", result: result("wrong") },
        }),
      );
      await vi.advanceTimersByTimeAsync(51);
      await expect(pending).resolves.toMatchObject({ status: "timeout" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("terminates the worker when an AbortSignal is cancelled", async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const client = createPyodideRunnerClient({ createWorker: () => worker });

    const pending = client.run(request(), { signal: controller.signal });
    controller.abort();

    await expect(pending).resolves.toMatchObject({
      status: "error",
      stderr: "Python execution was cancelled.",
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("loads only authored NumPy and uses exact-version package assets", async () => {
    const globals = {
      set: vi.fn(),
      destroy: vi.fn(),
    };
    const rawResult = {
      toString: () => JSON.stringify(result()),
      destroy: vi.fn(),
    };
    const pyodide = {
      globals: {
        get: vi.fn(() => () => globals),
      },
      loadPackage: vi.fn(async () => undefined),
      runPythonAsync: vi.fn(async () => rawResult),
    };

    await expect(
      executePythonRequestInPyodide(
        request("run-browser", {
          spec: executionSpec({ packages: ["numpy"] }),
        }),
        pyodide,
      ),
    ).resolves.toEqual(result());

    expect(PYODIDE_VERSION).toBe("314.0.3");
    expect(PYODIDE_PACKAGE_BASE_URL).toBe("https://cdn.jsdelivr.net/pyodide/v314.0.3/full/");
    expect(pyodide.loadPackage).toHaveBeenCalledWith("numpy");
    expect(globals.set).toHaveBeenCalledWith("_dsa_request_json", expect.any(String));
    expect(globals.destroy).toHaveBeenCalledOnce();
    expect(rawResult.destroy).toHaveBeenCalledOnce();
  });
});

describe("browser execution harness parity", () => {
  function executeWithCpython(value: PythonRunRequest): PythonRunResult {
    const source = `_dsa_request_json = __import__("sys").stdin.read()\n${BROWSER_EXECUTION_HARNESS}\nprint(_dsa_result_json)`;
    const output = execFileSync("python3", ["-c", source], {
      input: JSON.stringify(value),
      encoding: "utf8",
    });
    return JSON.parse(output) as PythonRunResult;
  }

  it("matches strict JSON, unordered, float, and stdout comparisons", () => {
    const parityRequest = request("run-parity", {
      code: [
        "def solve(value):",
        "    if value == 'unordered': return [3, {'a': [2, 1]}, 3]",
        "    if value == 'float': return 0.1 + 0.2",
        "    if value == 'stdout': print('observable')",
        "    return {'nested': [1, {'ok': True}]}",
      ].join("\n"),
      spec: executionSpec({
        cases: [
          {
            id: "deep",
            label: "Deep",
            input: "deep",
            expected: { nested: [1, { ok: true }] },
            comparison: "deep-equal",
          },
          {
            id: "unordered",
            label: "Unordered",
            input: "unordered",
            expected: [3, 3, { a: [1, 2] }],
            comparison: "unordered",
          },
          {
            id: "float",
            label: "Float",
            input: "float",
            expected: 0.3,
            comparison: "float",
            tolerance: 1e-9,
          },
          {
            id: "stdout",
            label: "Stdout",
            input: "stdout",
            expected: "observable\n",
            comparison: "stdout",
          },
        ],
      }),
    });

    const parity = executeWithCpython(parityRequest);

    expect(parity.status).toBe("passed");
    expect(parity.runtime).toBe("browser");
    expect(parity.cases.map((item) => item.status)).toEqual([
      "passed",
      "passed",
      "passed",
      "passed",
    ]);
    expect(parity.stdout).toBe("observable\n");
  });

  it("invokes function, class-method, and stdin contracts with server-parity bindings", () => {
    const functionResult = executeWithCpython(request());
    const classResult = executeWithCpython(
      request("run-class", {
        code: [
          "class Accumulator:",
          "    def __init__(self, base): self.base = base",
          "    def add(self, value): return self.base + value",
        ].join("\n"),
        spec: executionSpec({
          entrypoint: "Accumulator",
          invocation: {
            kind: "class-method",
            constructor: [{ from: "input", path: ["base"] }],
            method: "add",
            arguments: [{ from: "input", path: ["value"] }],
          },
          cases: [
            {
              id: "class",
              label: "Class",
              input: { base: 10, value: 4 },
              expected: 14,
              comparison: "deep-equal",
            },
          ],
        }),
      }),
    );
    const stdinResult = executeWithCpython(
      request("run-stdin", {
        code: "value = input()\nprint(value.upper())",
        spec: executionSpec({
          entrypoint: "main",
          invocation: { kind: "stdin", output: "text" },
          cases: [
            {
              id: "stdin",
              label: "Stdin",
              input: "machine learning\n",
              expected: "MACHINE LEARNING\n",
              comparison: "stdout",
            },
          ],
        }),
      }),
    );

    expect(functionResult.cases[0]).toMatchObject({ status: "passed", actual: 4 });
    expect(classResult.cases[0]).toMatchObject({ status: "passed", actual: 14 });
    expect(stdinResult.cases[0]).toMatchObject({
      status: "passed",
      actual: "MACHINE LEARNING\n",
    });
  });
});
