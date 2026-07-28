import {
  isJsonValue,
  type PythonCaseResult,
  type PythonExecutionStatus,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

export interface PythonRunnerClient {
  run(request: PythonRunRequest, options?: PythonRunnerRunOptions): Promise<PythonRunResult>;
}

export interface PythonRunnerRunOptions {
  readonly signal?: AbortSignal;
}

export interface PythonRunnerClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 31_000;

export function createPythonRunnerClient(options: PythonRunnerClientOptions): PythonRunnerClient {
  const fetchRequest = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const runUrl = `${options.baseUrl.replace(/\/+$/, "")}/run`;

  return {
    async run(request, runOptions = {}) {
      const started = Date.now();
      const controller = new AbortController();
      let timedOut = false;
      const cancel = () => controller.abort();
      if (runOptions.signal?.aborted) cancel();
      else runOptions.signal?.addEventListener("abort", cancel, { once: true });
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetchRequest(runUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) {
          return invalidResponse(request.runId, started);
        }
        let value: unknown;
        try {
          value = await response.json();
        } catch {
          return invalidResponse(request.runId, started);
        }
        return isPythonRunResult(value, request.runId)
          ? value
          : invalidResponse(request.runId, started);
      } catch {
        if (timedOut) {
          return executionError(
            request.runId,
            "timeout",
            `Python runner exceeded the ${timeoutMs} ms parent timeout.`,
            started,
          );
        }
        if (runOptions.signal?.aborted) {
          return executionError(request.runId, "error", "Python execution was cancelled.", started);
        }
        return executionError(request.runId, "error", "Python runner is unavailable.", started);
      } finally {
        clearTimeout(timeout);
        runOptions.signal?.removeEventListener("abort", cancel);
      }
    },
  };
}

function isPythonRunResult(value: unknown, runId: string): value is PythonRunResult {
  if (!isRecord(value)) return false;
  return (
    value.runId === runId &&
    isExecutionStatus(value.status) &&
    typeof value.stdout === "string" &&
    typeof value.stderr === "string" &&
    Array.isArray(value.cases) &&
    value.cases.every(isPythonCaseResult) &&
    isNonNegativeFiniteNumber(value.durationMs) &&
    value.runtime === "server"
  );
}

function isPythonCaseResult(value: unknown): value is PythonCaseResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isExecutionStatus(value.status) &&
    typeof value.stdout === "string" &&
    typeof value.stderr === "string" &&
    isNonNegativeFiniteNumber(value.durationMs) &&
    (!Object.hasOwn(value, "actual") || isJsonValue(value.actual))
  );
}

function isExecutionStatus(value: unknown): value is PythonExecutionStatus {
  return value === "passed" || value === "failed" || value === "error" || value === "timeout";
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(runId: string, started: number): PythonRunResult {
  return executionError(runId, "error", "Python runner returned an invalid response.", started);
}

function executionError(
  runId: string,
  status: "error" | "timeout",
  stderr: string,
  started: number,
): PythonRunResult {
  return {
    runId,
    status,
    stdout: "",
    stderr,
    cases: [],
    durationMs: Math.max(0, Date.now() - started),
    runtime: "server",
  };
}
