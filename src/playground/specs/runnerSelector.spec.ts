import { describe, expect, it, vi } from "vitest";
import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import type { PythonRunner } from "../types";
import {
  createHybridPythonRunner,
  isBrowserCompatible,
  selectPythonRuntime,
} from "../runnerSelector";

function spec(
  packages: PythonExecutionSpec["packages"] = [],
  runtime: PythonExecutionSpec["runtime"] = "browser",
): PythonExecutionSpec {
  return {
    runtime,
    entrypoint: "solve",
    invocation: {
      kind: "function",
      arguments: [{ from: "input", path: [] }],
    },
    packages,
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
}

function request(executionSpec = spec()): PythonRunRequest {
  return {
    runId: "run-selector",
    code: "def solve(value):\n    return value * 2",
    spec: executionSpec,
  };
}

function requestWithId(runId: string, executionSpec = spec()): PythonRunRequest {
  return {
    ...request(executionSpec),
    runId,
  };
}

function result(
  runtime: PythonRunResult["runtime"],
  overrides: Partial<PythonRunResult> = {},
): PythonRunResult {
  return {
    runId: "run-selector",
    status: "passed",
    stdout: "",
    stderr: "",
    cases: [],
    durationMs: 1,
    runtime,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function runner(run: PythonRunner["run"]): PythonRunner {
  return {
    cancel: vi.fn(),
    dispose: vi.fn(),
    run,
  };
}

describe("runner selection", () => {
  it.each([
    ["standard library", spec()],
    ["NumPy", spec(["numpy"])],
  ])("selects the browser for a browser-compatible %s spec", (_label, executionSpec) => {
    expect(isBrowserCompatible(executionSpec)).toBe(true);
    expect(selectPythonRuntime(executionSpec)).toBe("browser");
  });

  it("keeps PyTorch and authored server-only specs on the server", () => {
    const torch = spec(["torch"], "server");
    const authoredServer = spec([], "server");

    expect(isBrowserCompatible(torch)).toBe(false);
    expect(selectPythonRuntime(torch)).toBe("server");
    expect(isBrowserCompatible(authoredServer)).toBe(false);
    expect(selectPythonRuntime(authoredServer)).toBe("server");
  });

  it("honors an explicit server override without mutating the authored spec", () => {
    const browserSpec = spec(["numpy"]);

    expect(selectPythonRuntime(browserSpec, "server")).toBe("server");
    expect(browserSpec.runtime).toBe("browser");
  });
});

describe("hybrid Python runner", () => {
  it("does not fall back from an explicitly selected server", async () => {
    const authoredSpec = spec(["numpy"]);
    const server = runner(
      vi.fn(async (value) =>
        result("server", {
          runId: value.runId,
          status: "error",
          stderr: "Python runner is unavailable.",
        }),
      ),
    );
    const browser = runner(vi.fn(async (value) => result("browser", { runId: value.runId })));
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request(authoredSpec), { runtime: "server" })).resolves.toMatchObject({
      status: "error",
      runtime: "server",
      stderr: "Python runner is unavailable.",
    });

    expect(server.run).toHaveBeenCalledWith(
      expect.objectContaining({ spec: expect.objectContaining({ runtime: "server" }) }),
      expect.any(Object),
    );
    expect(browser.run).not.toHaveBeenCalled();
    expect(authoredSpec.runtime).toBe("browser");
  });

  it("falls back from an unavailable browser worker to the server with a cloned contract", async () => {
    const authoredSpec = spec();
    const browser = runner(
      vi.fn(async (value) =>
        result("browser", {
          runId: value.runId,
          status: "error",
          stderr: "Browser Python runtime is unavailable.",
        }),
      ),
    );
    const server = runner(vi.fn(async (value) => result("server", { runId: value.runId })));
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request(authoredSpec))).resolves.toMatchObject({
      status: "passed",
      runtime: "server",
    });
    expect(server.run).toHaveBeenCalledWith(
      expect.objectContaining({ spec: expect.objectContaining({ runtime: "server" }) }),
      expect.any(Object),
    );
    expect(authoredSpec.runtime).toBe("browser");
  });

  it.each([
    "Browser Python runtime returned an invalid response.",
    "Browser Python runtime initialization exceeded the 500 ms timeout.",
  ])("falls back automatically for browser infrastructure failure: %s", async (stderr) => {
    const browser = runner(
      vi.fn(async (value) =>
        result("browser", {
          runId: value.runId,
          status: "error",
          stderr,
        }),
      ),
    );
    const server = runner(vi.fn(async (value) => result("server", { runId: value.runId })));
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request())).resolves.toMatchObject({
      status: "passed",
      runtime: "server",
    });
    expect(server.run).toHaveBeenCalledOnce();
  });

  it("does not fall back from an explicitly selected browser after infrastructure failure", async () => {
    const browser = runner(
      vi.fn(async (value) =>
        result("browser", {
          runId: value.runId,
          status: "error",
          stderr: "Browser Python runtime returned an invalid response.",
        }),
      ),
    );
    const server = runner(vi.fn());
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request(), { runtime: "browser" })).resolves.toMatchObject({
      status: "error",
      runtime: "browser",
    });
    expect(server.run).not.toHaveBeenCalled();
  });

  it("cancels a prior server child and suppresses its late completion when the next same-ID run uses the browser", async () => {
    const serverCompletion = deferred<PythonRunResult>();
    const browserCompletion = deferred<PythonRunResult>();
    const server = runner(vi.fn(() => serverCompletion.promise));
    const browser = runner(vi.fn(() => browserCompletion.promise));
    const hybrid = createHybridPythonRunner({ browser, server });

    const firstRun = hybrid.run(requestWithId("shared-run"), { runtime: "server" });
    const secondRun = hybrid.run(requestWithId("shared-run"));

    expect(server.cancel).toHaveBeenCalledWith("shared-run");
    browserCompletion.resolve(result("browser", { runId: "shared-run" }));
    await expect(secondRun).resolves.toMatchObject({
      status: "passed",
      runtime: "browser",
    });

    serverCompletion.resolve(result("server", { runId: "shared-run" }));
    await expect(firstRun).resolves.toMatchObject({
      runId: "shared-run",
      status: "error",
      runtime: "server",
      stderr: "Python execution was superseded by a newer run.",
      cases: [],
    });
  });

  it("cancels a prior browser child and suppresses its late completion when the next different-ID run uses the server", async () => {
    const browserCompletion = deferred<PythonRunResult>();
    const serverCompletion = deferred<PythonRunResult>();
    const browser = runner(vi.fn(() => browserCompletion.promise));
    const server = runner(vi.fn(() => serverCompletion.promise));
    const hybrid = createHybridPythonRunner({ browser, server });

    const firstRun = hybrid.run(requestWithId("browser-run"));
    const secondRun = hybrid.run(requestWithId("server-run"), { runtime: "server" });

    expect(browser.cancel).toHaveBeenCalledWith("browser-run");
    serverCompletion.resolve(result("server", { runId: "server-run" }));
    await expect(secondRun).resolves.toMatchObject({
      runId: "server-run",
      status: "passed",
      runtime: "server",
    });

    browserCompletion.resolve(result("browser", { runId: "browser-run" }));
    await expect(firstRun).resolves.toMatchObject({
      runId: "browser-run",
      status: "error",
      runtime: "browser",
      stderr: "Python execution was superseded by a newer run.",
      cases: [],
    });
  });

  it("does not hide learner failures behind runtime fallback", async () => {
    const browser = runner(
      vi.fn(async () =>
        result("browser", {
          status: "error",
          stderr: "SyntaxError: invalid syntax",
          cases: [
            {
              id: "public",
              status: "error",
              stdout: "",
              stderr: "SyntaxError: invalid syntax",
              durationMs: 1,
            },
          ],
        }),
      ),
    );
    const server = runner(vi.fn());
    const hybrid = createHybridPythonRunner({ browser, server });

    await expect(hybrid.run(request())).resolves.toMatchObject({
      status: "error",
      stderr: "SyntaxError: invalid syntax",
    });
    expect(server.run).not.toHaveBeenCalled();
  });

  it("never sends an authored server-only contract to the browser", async () => {
    const browser = runner(vi.fn());
    const server = runner(
      vi.fn(async () =>
        result("server", {
          status: "error",
          stderr: "Python runner is unavailable.",
        }),
      ),
    );
    const hybrid = createHybridPythonRunner({ browser, server });

    await hybrid.run(request(spec([], "server")));

    expect(browser.run).not.toHaveBeenCalled();
  });

  it("forwards cancellation and disposal to both runtimes", async () => {
    const browser = runner(vi.fn());
    const server = runner(vi.fn());
    const hybrid = createHybridPythonRunner({ browser, server });

    await hybrid.cancel("run-selector");
    hybrid.dispose();

    expect(browser.cancel).toHaveBeenCalledWith("run-selector");
    expect(server.cancel).toHaveBeenCalledWith("run-selector");
    expect(browser.dispose).toHaveBeenCalledOnce();
    expect(server.dispose).toHaveBeenCalledOnce();
  });
});
