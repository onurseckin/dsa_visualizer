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
  it("falls back from an unavailable server to the browser only for a compatible spec", async () => {
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
      status: "passed",
      runtime: "browser",
    });

    expect(server.run).toHaveBeenCalledWith(
      expect.objectContaining({ spec: expect.objectContaining({ runtime: "server" }) }),
      expect.any(Object),
    );
    expect(browser.run).toHaveBeenCalledWith(
      expect.objectContaining({ spec: expect.objectContaining({ runtime: "browser" }) }),
      expect.any(Object),
    );
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
