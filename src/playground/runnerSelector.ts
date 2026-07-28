import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
  PythonRuntime,
} from "@dsa-visualizer/execution-contracts";

import type { PythonRunner, PythonRunnerRunOptions, PythonRuntimePreference } from "./types";

export interface HybridPythonRunnerOptions {
  readonly browser: PythonRunner;
  readonly server: PythonRunner;
}

export function isBrowserCompatible(spec: PythonExecutionSpec): boolean {
  return (
    spec.runtime === "browser" && spec.packages.every((packageName) => packageName === "numpy")
  );
}

export function selectPythonRuntime(
  spec: PythonExecutionSpec,
  preference: PythonRuntimePreference = "auto",
): PythonRuntime {
  if (preference === "server") return "server";
  if (preference === "browser" && isBrowserCompatible(spec)) return "browser";
  return isBrowserCompatible(spec) ? "browser" : "server";
}

export function createHybridPythonRunner(options: HybridPythonRunnerOptions): PythonRunner {
  return {
    async run(request, runOptions = {}) {
      const primaryRuntime = selectPythonRuntime(request.spec, runOptions.runtime ?? "auto");
      const primary = runnerFor(primaryRuntime, options);
      const primaryResult = await primary.run(
        cloneRequestRuntime(request, primaryRuntime),
        withoutRuntimePreference(runOptions),
      );

      if (!isInfrastructureFailure(primaryResult) || !isBrowserCompatible(request.spec)) {
        return primaryResult;
      }

      const fallbackRuntime = primaryRuntime === "browser" ? "server" : "browser";
      const fallback = runnerFor(fallbackRuntime, options);
      return fallback.run(
        cloneRequestRuntime(request, fallbackRuntime),
        withoutRuntimePreference(runOptions),
      );
    },
    async cancel(runId) {
      await Promise.all([options.browser.cancel(runId), options.server.cancel(runId)]);
    },
    dispose() {
      options.browser.dispose();
      options.server.dispose();
    },
  };
}

function runnerFor(runtime: PythonRuntime, options: HybridPythonRunnerOptions): PythonRunner {
  return runtime === "browser" ? options.browser : options.server;
}

function cloneRequestRuntime(request: PythonRunRequest, runtime: PythonRuntime): PythonRunRequest {
  return {
    ...request,
    spec: {
      ...request.spec,
      runtime,
    },
  };
}

function withoutRuntimePreference(options: PythonRunnerRunOptions): PythonRunnerRunOptions {
  return options.signal ? { signal: options.signal } : {};
}

function isInfrastructureFailure(result: PythonRunResult): boolean {
  if (result.status !== "error" || result.cases.length > 0) return false;
  return (
    result.stderr === "Browser Python runtime is unavailable." ||
    result.stderr === "Python runner is unavailable." ||
    result.stderr === "Python runner returned an invalid response."
  );
}
