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
  PYODIDE_CORE_BASE_PATH,
  PYODIDE_PACKAGE_BASE_URL,
  PYODIDE_VERSION,
} from "../pyodideRunner.worker";
import { createHybridPythonRunner } from "../runnerSelector";

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

  private token(): string | undefined {
    const message = this.postMessage.mock.lastCall?.[0] as { token?: string } | undefined;
    return message?.token;
  }

  emitReady(runId = "run-browser", token = this.token()): void {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "ready", runId, token },
      }),
    );
  }

  emitResult(value: PythonRunResult, token = this.token()): void {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "result", runId: value.runId, token, result: value },
      }),
    );
  }

  emitMessage(data: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
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
      token: expect.any(String),
    });

    workers[0]?.emitReady();
    workers[0]?.emitResult(result());
    await expect(pending).resolves.toEqual(result());
  });

  it("normalizes Worker construction failures so hybrid auto mode falls back", async () => {
    const browser = createPyodideRunnerClient({
      createWorker: () => {
        throw new DOMException("blocked by policy", "SecurityError");
      },
    });
    const serverRun = vi.fn(async (value: PythonRunRequest) => ({
      ...result(value.runId),
      runtime: "server" as const,
    }));
    const server = {
      run: serverRun,
      cancel: vi.fn(async () => undefined),
      dispose: vi.fn(),
    };
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request())).resolves.toMatchObject({
      status: "passed",
      runtime: "server",
    });
    expect(serverRun).toHaveBeenCalledOnce();
  });

  it("starts the learner wall timer only after Pyodide and authored packages are ready", async () => {
    vi.useFakeTimers();
    try {
      const workers: FakeWorker[] = [];
      const client = createPyodideRunnerClient({
        initializationTimeoutMs: 500,
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker;
        },
      });

      const timedOut = client.run(request());
      await vi.advanceTimersByTimeAsync(100);
      expect(workers[0]?.terminate).not.toHaveBeenCalled();

      workers[0]?.emitReady();
      await vi.advanceTimersByTimeAsync(51);
      await expect(timedOut).resolves.toMatchObject({
        runId: "run-browser",
        status: "timeout",
        runtime: "browser",
      });
      expect(workers[0]?.terminate).toHaveBeenCalledOnce();

      const next = client.run(request("run-next"));
      expect(workers).toHaveLength(2);
      workers[1]?.emitReady("run-next");
      workers[1]?.emitResult(result("run-next"));
      await expect(next).resolves.toMatchObject({ runId: "run-next", status: "passed" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("caps initialization separately and recreates a Worker after initialization timeout", async () => {
    vi.useFakeTimers();
    try {
      const workers: FakeWorker[] = [];
      const client = createPyodideRunnerClient({
        initializationTimeoutMs: 500,
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker;
        },
      });

      const timedOut = client.run(request());
      await vi.advanceTimersByTimeAsync(501);
      await expect(timedOut).resolves.toMatchObject({
        status: "error",
        stderr: "Browser Python runtime initialization exceeded the 500 ms timeout.",
      });
      expect(workers[0]?.terminate).toHaveBeenCalledOnce();

      const next = client.run(request("run-next"));
      workers[1]?.emitReady("run-next");
      workers[1]?.emitResult(result("run-next"));
      await expect(next).resolves.toMatchObject({ runId: "run-next", status: "passed" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("caps a caller-provided initialization timeout at the client policy ceiling", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      const client = createPyodideRunnerClient({
        createWorker: () => worker,
        initializationTimeoutMs: 999_999,
      });

      const pending = client.run(request());
      await vi.advanceTimersByTimeAsync(120_001);

      await expect(pending).resolves.toMatchObject({
        status: "error",
        stderr: "Browser Python runtime initialization exceeded the 120000 ms timeout.",
      });
      expect(worker.terminate).toHaveBeenCalledOnce();
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
    workers[1]?.emitReady("run-current");
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

  it("gates ready, results, and errors by Worker identity and execution token", async () => {
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

      const stale = client.run(request("same-run"));
      const current = client.run(request("same-run"));
      await expect(stale).resolves.toMatchObject({
        status: "error",
        stderr: "Python execution was superseded by a newer run.",
      });

      workers[0]?.emitReady("same-run");
      workers[0]?.emitResult(result("same-run"));
      workers[0]?.emitError();
      workers[1]?.emitMessage({
        type: "ready",
        runId: "same-run",
        token: "forged-token",
      });
      workers[1]?.emitMessage({
        type: "result",
        runId: "same-run",
        token: "forged-token",
        result: result("same-run"),
      });
      expect(workers[1]?.terminate).not.toHaveBeenCalled();

      workers[1]?.emitReady("same-run");
      workers[1]?.emitResult(result("same-run"));
      await expect(current).resolves.toMatchObject({ status: "passed" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("normalizes current Worker errors and invalid bounded responses", async () => {
    const workers: FakeWorker[] = [];
    const client = createPyodideRunnerClient({
      createWorker: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
    });

    const failed = client.run(request());
    workers[0]?.emitError();
    await expect(failed).resolves.toMatchObject({
      status: "error",
      stderr: "Browser Python runtime is unavailable.",
    });
    expect(workers[0]?.terminate).toHaveBeenCalledOnce();

    const malformed = client.run(request("run-malformed"));
    workers[1]?.emitReady("run-malformed");
    workers[1]?.emitMessage({
      type: "result",
      runId: "run-malformed",
      token: (workers[1]?.postMessage.mock.lastCall?.[0] as { readonly token?: string } | undefined)
        ?.token,
      result: {
        runId: "run-malformed",
        runtime: "browser",
      },
    });
    await expect(malformed).resolves.toMatchObject({
      status: "error",
      stderr: "Browser Python runtime returned an invalid response.",
    });
    expect(workers[1]?.terminate).toHaveBeenCalledOnce();

    const oversizedRequest = request("run-oversized-response", {
      spec: executionSpec({ limits: { wallTimeMs: 50, maxOutputBytes: 16 } }),
    });
    const oversized = client.run(oversizedRequest);
    workers[2]?.emitReady("run-oversized-response");
    workers[2]?.emitResult({
      ...result("run-oversized-response"),
      stdout: "x".repeat(17),
      cases: [
        {
          ...result("run-oversized-response").cases[0]!,
          stdout: "x".repeat(17),
        },
      ],
    });
    await expect(oversized).resolves.toMatchObject({
      status: "error",
      stderr: "Browser Python runtime returned an invalid response.",
    });
    expect(workers[2]?.terminate).toHaveBeenCalledOnce();
  });

  it("retires a Worker when initialization fails before readiness", async () => {
    const workers: FakeWorker[] = [];
    const client = createPyodideRunnerClient({
      createWorker: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
    });

    const initialization = client.run(request("run-init-failure"));
    workers[0]?.emitResult({
      runId: "run-init-failure",
      status: "error",
      stdout: "",
      stderr: "Browser Python runtime is unavailable.",
      cases: [],
      durationMs: 0,
      runtime: "browser",
    });
    await expect(initialization).resolves.toMatchObject({
      status: "error",
      stderr: "Browser Python runtime is unavailable.",
    });
    expect(workers[0]?.terminate).toHaveBeenCalledOnce();

    const recovered = client.run(request("run-recovered"));
    expect(workers).toHaveLength(2);
    workers[1]?.emitReady("run-recovered");
    workers[1]?.emitResult(result("run-recovered"));
    await expect(recovered).resolves.toMatchObject({
      status: "passed",
      runId: "run-recovered",
    });
  });

  it("uses one deep immutable request snapshot for dispatch, timing, and validation", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      const client = createPyodideRunnerClient({ createWorker: () => worker });
      const authored = request("run-snapshot", {
        caseIds: ["public"],
        spec: executionSpec({
          limits: { wallTimeMs: 50 },
          cases: [
            {
              id: "public",
              label: "Public",
              input: { values: [2] },
              expected: { doubled: [4] },
              comparison: "deep-equal",
            },
          ],
        }),
      });

      const pending = client.run(authored);
      const posted = (
        worker.postMessage.mock.lastCall?.[0] as { readonly request?: PythonRunRequest } | undefined
      )?.request;

      (authored.caseIds as string[])[0] = "mutated";
      (authored.spec.packages as string[]).push("numpy");
      (authored.spec.limits as { wallTimeMs: number }).wallTimeMs = 1;
      (authored.spec.cases as unknown as { id: string }[])[0]!.id = "mutated";
      (
        authored.spec.cases[0]!.input as {
          values: number[];
        }
      ).values[0] = 99;

      expect(posted).toMatchObject({
        caseIds: ["public"],
        spec: {
          packages: [],
          limits: { wallTimeMs: 50 },
          cases: [{ id: "public", input: { values: [2] } }],
        },
      });
      expect(Object.isFrozen(posted)).toBe(true);
      expect(Object.isFrozen(posted?.spec.cases[0]?.input)).toBe(true);

      worker.emitReady("run-snapshot");
      await vi.advanceTimersByTimeAsync(2);
      worker.emitResult({
        runId: "run-snapshot",
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
            actual: { doubled: [4] },
          },
        ],
        durationMs: 2,
        runtime: "browser",
      });
      await expect(pending).resolves.toMatchObject({
        status: "passed",
        runId: "run-snapshot",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects invalid bounded requests before constructing a Worker", async () => {
    const createWorker = vi.fn(() => new FakeWorker());
    const client = createPyodideRunnerClient({ createWorker });
    const base = request("run-invalid");
    const invalidRequests: PythonRunRequest[] = [
      {
        ...base,
        code: "x".repeat(9),
        spec: executionSpec({ limits: { wallTimeMs: 50, maxSourceBytes: 8 } }),
      },
      {
        ...base,
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxInputBytes: 1 },
          cases: [{ ...base.spec.cases[0]!, input: "oversized input" }],
        }),
      },
      {
        ...base,
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxCases: 1 },
          cases: [base.spec.cases[0]!, { ...base.spec.cases[0]!, id: "second", label: "Second" }],
        }),
      },
      { ...base, caseIds: ["missing"] },
      {
        ...base,
        spec: executionSpec({
          limits: { wallTimeMs: 0 },
        }),
      },
    ];

    for (const invalid of invalidRequests) {
      await expect(client.run(invalid)).resolves.toMatchObject({
        runId: "run-invalid",
        status: "error",
        stderr: "Python execution request is invalid.",
        runtime: "browser",
      });
    }
    expect(createWorker).not.toHaveBeenCalled();
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

  it("loads authored NumPy before reporting readiness and uses exact-version assets", async () => {
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
    const onReady = vi.fn();

    await expect(
      executePythonRequestInPyodide(
        request("run-browser", {
          spec: executionSpec({ packages: ["numpy"] }),
        }),
        pyodide,
        onReady,
      ),
    ).resolves.toEqual(result());

    expect(PYODIDE_VERSION).toBe("314.0.3");
    expect(PYODIDE_CORE_BASE_PATH).toBe("assets/pyodide/314.0.3/");
    expect(PYODIDE_PACKAGE_BASE_URL).toBe("https://cdn.jsdelivr.net/pyodide/v314.0.3/full/");
    expect(pyodide.loadPackage).toHaveBeenCalledWith("numpy");
    expect(onReady).toHaveBeenCalledOnce();
    expect(pyodide.loadPackage.mock.invocationCallOrder[0]).toBeLessThan(
      onReady.mock.invocationCallOrder[0]!,
    );
    expect(onReady.mock.invocationCallOrder[0]).toBeLessThan(
      pyodide.runPythonAsync.mock.invocationCallOrder[0]!,
    );
    expect(globals.set).toHaveBeenCalledWith("_dsa_request_json", expect.any(String));
    expect(globals.destroy).toHaveBeenCalledOnce();
    expect(rawResult.destroy).toHaveBeenCalledOnce();
  });
});

describe("browser execution harness parity", () => {
  const utf8Bytes = (value: string) => new TextEncoder().encode(value).byteLength;

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

  it("shares one retained output budget while comparing stdout independently", () => {
    const bounded = executeWithCpython(
      request("run-aggregate-output", {
        code: [
          "def solve(value):",
          "    if value == 'noise':",
          "        print('N' * 200)",
          "        return 1",
          "    if value == 'semantic':",
          "        print('ok')",
          "        return None",
          "    import sys",
          "    print('E' * 200, file=sys.stderr)",
          "    return 3",
        ].join("\n"),
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxOutputBytes: 64 },
          cases: [
            {
              id: "noise",
              label: "Noise",
              input: "noise",
              expected: 1,
              comparison: "deep-equal",
            },
            {
              id: "semantic",
              label: "Semantic stdout",
              input: "semantic",
              expected: "ok\n",
              comparison: "stdout",
            },
            {
              id: "stderr",
              label: "Stderr",
              input: "stderr",
              expected: 3,
              comparison: "deep-equal",
            },
          ],
        }),
      }),
    );

    expect(bounded.cases.map((item) => item.status)).toEqual(["passed", "passed", "passed"]);
    expect(bounded.cases[1]).toMatchObject({ status: "passed" });
    expect(
      utf8Bytes(bounded.cases.flatMap((item) => [item.stdout, item.stderr]).join("")),
    ).toBeLessThanOrEqual(64);
    expect(utf8Bytes(bounded.stdout) + utf8Bytes(bounded.stderr)).toBeLessThanOrEqual(64);
  });

  it("rejects aggregate expected stdout beyond the authored output envelope", () => {
    const invalid = executeWithCpython(
      request("run-expected-output", {
        code: "def solve(value):\n    print(value)",
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxOutputBytes: 5 },
          cases: [
            {
              id: "one",
              label: "One",
              input: "aaa",
              expected: "aaa\n",
              comparison: "stdout",
            },
            {
              id: "two",
              label: "Two",
              input: "bbb",
              expected: "bbb\n",
              comparison: "stdout",
            },
          ],
        }),
      }),
    );

    expect(invalid).toMatchObject({
      runId: "run-expected-output",
      status: "error",
      stdout: "",
      stderr: "Combined expected stdout exceeds maxOutputBytes.",
      cases: [],
      runtime: "browser",
    });
  });

  it("streams a bounded traceback tail and bounds aggregate result payloads", () => {
    const diagnostic = executeWithCpython(
      request("run-diagnostic-tail", {
        code: [
          "def solve(value):",
          "    print('discard-me-' * 100)",
          "    raise ValueError('important-tail')",
        ].join("\n"),
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxOutputBytes: 96, maxResultBytes: 24 },
          cases: [
            {
              id: "error",
              label: "Error",
              input: 1,
              expected: null,
              comparison: "deep-equal",
            },
          ],
        }),
      }),
    );
    const results = executeWithCpython(
      request("run-result-budget", {
        code: "def solve(value):\n    return 'x' * value",
        spec: executionSpec({
          limits: { wallTimeMs: 50, maxResultBytes: 24 },
          cases: [
            {
              id: "first",
              label: "First",
              input: 20,
              expected: "x".repeat(20),
              comparison: "deep-equal",
            },
            {
              id: "second",
              label: "Second",
              input: 20,
              expected: "x".repeat(20),
              comparison: "deep-equal",
            },
          ],
        }),
      }),
    );

    expect(diagnostic.status).toBe("error");
    expect(diagnostic.stderr).toContain("ValueError: important-tail");
    expect(utf8Bytes(diagnostic.stdout) + utf8Bytes(diagnostic.stderr)).toBeLessThanOrEqual(96);
    expect(results.status).toBe("error");
    expect(results.cases.filter((item) => Object.hasOwn(item, "actual"))).toHaveLength(1);
    expect(results.cases[1]).toMatchObject({
      status: "error",
      stderr: "Combined results exceed maxResultBytes.",
    });
  });
});
