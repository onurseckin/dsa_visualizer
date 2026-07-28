import type {
  PythonRunRequest,
  PythonRunResult,
  PythonRuntime,
} from "@dsa-visualizer/execution-contracts";

export type PythonRuntimePreference = "auto" | PythonRuntime;

export interface PythonRunnerRunOptions {
  readonly runtime?: PythonRuntimePreference;
  readonly signal?: AbortSignal;
}

export interface PythonRunner {
  run(request: PythonRunRequest, options?: PythonRunnerRunOptions): Promise<PythonRunResult>;
  cancel(runId: string): Promise<void>;
  dispose(): void;
}

export function executionErrorResult(
  runId: string,
  runtime: PythonRuntime,
  stderr: string,
  status: "error" | "timeout" = "error",
  durationMs = 0,
): PythonRunResult {
  return {
    runId,
    status,
    stdout: "",
    stderr,
    cases: [],
    durationMs: Math.max(0, durationMs),
    runtime,
  };
}
