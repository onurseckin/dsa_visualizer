import {
  isJsonValue,
  type PythonCaseResult,
  type PythonExecutionStatus,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { executionErrorResult, type PythonRunner, type PythonRunnerRunOptions } from "./types";

export interface ServerPythonRunnerClientOptions {
  readonly cancelEndpoint?: string;
  readonly endpoint?: string;
  readonly fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  readonly timeoutMs?: number;
}

interface ActiveServerRun {
  readonly abortController: AbortController;
  readonly request: PythonRunRequest;
  readonly resolve: (result: PythonRunResult) => void;
  readonly signal?: AbortSignal;
  readonly startedAt: number;
  readonly timeout: ReturnType<typeof setTimeout>;
  readonly abortListener?: () => void;
  settled: boolean;
  timedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 31_000;

export function createServerPythonRunnerClient(
  options: ServerPythonRunnerClientOptions = {},
): PythonRunner {
  const fetchRequest = options.fetch ?? fetch;
  const endpoint = options.endpoint ?? "/api/python/run";
  const cancelEndpoint = options.cancelEndpoint ?? "/api/python/cancel";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let active: ActiveServerRun | undefined;

  const sendCancellation = async (runId: string) => {
    try {
      await fetchRequest(cancelEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
    } catch {
      // Cancellation remains best-effort while the local Compose stack shuts down.
    }
  };

  const settle = (record: ActiveServerRun, result: PythonRunResult) => {
    if (record.settled) return;
    record.settled = true;
    clearTimeout(record.timeout);
    if (record.abortListener) {
      record.signal?.removeEventListener("abort", record.abortListener);
    }
    if (active === record) active = undefined;
    record.resolve(result);
  };

  const interruptActive = (stderr: string, status: "error" | "timeout" = "error") => {
    if (!active) return;
    const record = active;
    record.timedOut = status === "timeout";
    record.abortController.abort();
    void sendCancellation(record.request.runId);
    settle(
      record,
      executionErrorResult(
        record.request.runId,
        "server",
        stderr,
        status,
        Date.now() - record.startedAt,
      ),
    );
  };

  return {
    run(request, runOptions: PythonRunnerRunOptions = {}) {
      if (active) {
        interruptActive("Python execution was superseded by a newer run.");
      }

      return new Promise<PythonRunResult>((resolve) => {
        const abortController = new AbortController();
        const serverRequest = cloneAsServerRequest(request);
        const record: ActiveServerRun = {
          abortController,
          request: serverRequest,
          resolve,
          signal: runOptions.signal,
          startedAt: Date.now(),
          timeout: setTimeout(() => {
            if (active !== record) return;
            interruptActive(
              `Python runner exceeded the ${timeoutMs} ms request timeout.`,
              "timeout",
            );
          }, timeoutMs),
          settled: false,
          timedOut: false,
        };
        const abortListener = () => {
          if (active !== record) return;
          interruptActive("Python execution was cancelled.");
        };
        (record as { abortListener?: () => void }).abortListener = abortListener;
        active = record;

        if (runOptions.signal?.aborted) {
          interruptActive("Python execution was cancelled.");
          return;
        }
        runOptions.signal?.addEventListener("abort", abortListener, { once: true });

        void fetchRequest(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serverRequest),
          signal: abortController.signal,
        })
          .then(async (response) => {
            if (record.settled) return;
            if (!response.ok) {
              settle(
                record,
                executionErrorResult(
                  request.runId,
                  "server",
                  response.status >= 500
                    ? "Python runner is unavailable."
                    : "Python runner returned an invalid response.",
                  "error",
                  Date.now() - record.startedAt,
                ),
              );
              return;
            }
            let value: unknown;
            try {
              value = await response.json();
            } catch {
              value = undefined;
            }
            settle(
              record,
              isPythonRunResult(value, request.runId)
                ? value
                : executionErrorResult(
                    request.runId,
                    "server",
                    "Python runner returned an invalid response.",
                    "error",
                    Date.now() - record.startedAt,
                  ),
            );
          })
          .catch(() => {
            if (record.settled) return;
            settle(
              record,
              executionErrorResult(
                request.runId,
                "server",
                "Python runner is unavailable.",
                "error",
                Date.now() - record.startedAt,
              ),
            );
          });
      });
    },
    async cancel(runId) {
      if (active?.request.runId === runId) {
        interruptActive("Python execution was cancelled.");
        return;
      }
      await sendCancellation(runId);
    },
    dispose() {
      if (active) interruptActive("Python execution was cancelled.");
    },
  };
}

function cloneAsServerRequest(request: PythonRunRequest): PythonRunRequest {
  return {
    ...request,
    spec: {
      ...request.spec,
      runtime: "server",
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
