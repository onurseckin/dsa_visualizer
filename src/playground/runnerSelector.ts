import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
  PythonRuntime,
} from "@dsa-visualizer/execution-contracts";

import {
  executionErrorResult,
  isPythonRunnerInfrastructureFailure,
  type PythonRunner,
  type PythonRunnerRunOptions,
  type PythonRuntimePreference,
} from "./types";

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
  let generation = 0;
  let activeChild:
    | {
        readonly generation: number;
        readonly runId: string;
        readonly runner: PythonRunner;
      }
    | undefined;

  async function runChild(
    request: PythonRunRequest,
    runtime: PythonRuntime,
    runOptions: PythonRunnerRunOptions,
    runGeneration: number,
  ): Promise<PythonRunResult> {
    const runner = runnerFor(runtime, options);
    const child = {
      generation: runGeneration,
      runId: request.runId,
      runner,
    };
    activeChild = child;

    try {
      const childResult = await runner.run(
        cloneRequestRuntime(request, runtime),
        withoutRuntimePreference(runOptions),
      );
      return runGeneration === generation ? childResult : supersededResult(request.runId, runtime);
    } catch (error) {
      if (runGeneration !== generation) {
        return supersededResult(request.runId, runtime);
      }
      throw error;
    } finally {
      if (activeChild === child) {
        activeChild = undefined;
      }
    }
  }

  return {
    async run(request, runOptions = {}) {
      const runGeneration = ++generation;
      const previousChild = activeChild;
      if (previousChild) {
        activeChild = undefined;
        try {
          await previousChild.runner.cancel(previousChild.runId);
        } catch {
          // A failed best-effort cancellation must not block the newer run.
        }
      }

      const preference = runOptions.runtime ?? "auto";
      const primaryRuntime = selectPythonRuntime(request.spec, preference);
      if (runGeneration !== generation) {
        return supersededResult(request.runId, primaryRuntime);
      }

      const primaryResult = await runChild(request, primaryRuntime, runOptions, runGeneration);

      if (
        runGeneration !== generation ||
        preference !== "auto" ||
        !isPythonRunnerInfrastructureFailure(primaryResult) ||
        !isBrowserCompatible(request.spec)
      ) {
        return primaryResult;
      }

      const fallbackRuntime = primaryRuntime === "browser" ? "server" : "browser";
      return runChild(request, fallbackRuntime, runOptions, runGeneration);
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

function supersededResult(runId: string, runtime: PythonRuntime): PythonRunResult {
  return executionErrorResult(runId, runtime, "Python execution was superseded by a newer run.");
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
