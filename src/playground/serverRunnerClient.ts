import {
  validatePythonRunRequest,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import {
  createPythonRunRequestSnapshot,
  executionErrorResult,
  PYTHON_RUNNER_INFRASTRUCTURE_ERRORS,
  type PythonRunner,
  type PythonRunnerRunOptions,
  validatePythonRunResult,
} from "./types";

export interface ServerPythonRunnerClientOptions {
  readonly cancelEndpoint?: string;
  readonly endpoint?: string;
  readonly executionIdFactory?: () => string;
  readonly fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  readonly timeoutMs?: number;
}

interface ActiveServerRun {
  readonly abortController: AbortController;
  readonly logicalRunId: string;
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
let clientSequence = 0;

function createDefaultExecutionIdFactory(): () => string {
  const clientId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${(++clientSequence).toString(36)}`;
  let executionSequence = 0;
  return () => `python-${clientId}-${(++executionSequence).toString(36)}`;
}

export function createServerPythonRunnerClient(
  options: ServerPythonRunnerClientOptions = {},
): PythonRunner {
  const fetchRequest = options.fetch ?? fetch;
  const endpoint = options.endpoint ?? "/api/python/run";
  const cancelEndpoint = options.cancelEndpoint ?? "/api/python/cancel";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const executionIdFactory = options.executionIdFactory ?? createDefaultExecutionIdFactory();
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
        record.logicalRunId,
        "server",
        stderr,
        status,
        Date.now() - record.startedAt,
      ),
    );
  };

  return {
    run(request, runOptions: PythonRunnerRunOptions = {}) {
      const logicalRunId = request.runId;
      const clonedRequest = cloneAsServerRequest(request, executionIdFactory());
      const requestValidation = validatePythonRunRequest(clonedRequest);
      if (!requestValidation.ok) {
        return Promise.resolve(
          executionErrorResult(logicalRunId, "server", "Python execution request is invalid."),
        );
      }
      let serverRequest: PythonRunRequest;
      try {
        serverRequest = createPythonRunRequestSnapshot(requestValidation.value);
      } catch {
        return Promise.resolve(
          executionErrorResult(logicalRunId, "server", "Python execution request is invalid."),
        );
      }
      if (!validatePythonRunRequest(serverRequest).ok) {
        return Promise.resolve(
          executionErrorResult(logicalRunId, "server", "Python execution request is invalid."),
        );
      }

      if (active) {
        interruptActive("Python execution was superseded by a newer run.");
      }

      return new Promise<PythonRunResult>((resolve) => {
        const abortController = new AbortController();
        const record: ActiveServerRun = {
          abortController,
          logicalRunId,
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
                  logicalRunId,
                  "server",
                  response.status >= 500
                    ? PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverUnavailable
                    : PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverInvalidResponse,
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
            const resultValidation = validatePythonRunResult(serverRequest, value, "server");
            settle(
              record,
              resultValidation.ok
                ? { ...resultValidation.value, runId: logicalRunId }
                : executionErrorResult(
                    logicalRunId,
                    "server",
                    PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverInvalidResponse,
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
                logicalRunId,
                "server",
                PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverUnavailable,
                "error",
                Date.now() - record.startedAt,
              ),
            );
          });
      });
    },
    async cancel(runId) {
      if (active?.logicalRunId === runId) {
        interruptActive("Python execution was cancelled.");
      }
    },
    dispose() {
      if (active) interruptActive("Python execution was cancelled.");
    },
  };
}

function cloneAsServerRequest(request: PythonRunRequest, executionId: string): PythonRunRequest {
  return {
    ...request,
    runId: executionId,
    spec: {
      ...request.spec,
      runtime: "server",
    },
  };
}
