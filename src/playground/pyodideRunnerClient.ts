import {
  DEFAULT_PYTHON_EXECUTION_LIMITS,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { isBrowserCompatible } from "./runnerSelector";
import { executionErrorResult, type PythonRunner, type PythonRunnerRunOptions } from "./types";

export interface PyodideWorkerLike {
  addEventListener(type: "error" | "message", listener: EventListenerOrEventListenerObject): void;
  postMessage(value: unknown): void;
  terminate(): void;
}

export interface PyodideRunnerClientOptions {
  readonly createWorker?: () => PyodideWorkerLike;
}

interface ActiveBrowserRun {
  readonly request: PythonRunRequest;
  readonly resolve: (result: PythonRunResult) => void;
  readonly startedAt: number;
  readonly timeout: ReturnType<typeof setTimeout>;
  readonly signal?: AbortSignal;
  readonly abortListener?: () => void;
  settled: boolean;
}

export function createPyodideRunnerClient(options: PyodideRunnerClientOptions = {}): PythonRunner {
  const createWorker = options.createWorker ?? createModuleWorker;
  let worker: PyodideWorkerLike | undefined;
  let active: ActiveBrowserRun | undefined;

  const terminateWorker = () => {
    worker?.terminate();
    worker = undefined;
  };

  const settle = (record: ActiveBrowserRun, result: PythonRunResult, terminate = false) => {
    if (record.settled) return;
    record.settled = true;
    clearTimeout(record.timeout);
    if (record.abortListener) {
      record.signal?.removeEventListener("abort", record.abortListener);
    }
    if (active === record) active = undefined;
    if (terminate) terminateWorker();
    record.resolve(result);
  };

  const interruptActive = (message: string, status: "error" | "timeout" = "error") => {
    if (!active) return;
    const record = active;
    settle(
      record,
      executionErrorResult(
        record.request.runId,
        "browser",
        message,
        status,
        Date.now() - record.startedAt,
      ),
      true,
    );
  };

  const ensureWorker = () => {
    if (worker) return worker;
    const created = createWorker();
    created.addEventListener("message", (event) => {
      const message = (event as MessageEvent<unknown>).data;
      if (!active || !isWorkerResult(message, active.request.runId)) return;
      settle(active, message.result);
    });
    created.addEventListener("error", () => {
      interruptActive("Browser Python runtime is unavailable.");
    });
    worker = created;
    return created;
  };

  return {
    run(request, runOptions: PythonRunnerRunOptions = {}) {
      if (active) {
        interruptActive("Python execution was superseded by a newer run.");
      }
      if (!isBrowserCompatible(request.spec)) {
        return Promise.resolve(
          executionErrorResult(
            request.runId,
            "browser",
            "This exercise requires the server Python runtime.",
          ),
        );
      }

      return new Promise<PythonRunResult>((resolve) => {
        const startedAt = Date.now();
        const wallTimeMs =
          request.spec.limits?.wallTimeMs ?? DEFAULT_PYTHON_EXECUTION_LIMITS.wallTimeMs;
        const record: ActiveBrowserRun = {
          request,
          resolve,
          startedAt,
          timeout: setTimeout(() => {
            if (active !== record) return;
            interruptActive(
              `Browser Python execution exceeded the ${wallTimeMs} ms timeout.`,
              "timeout",
            );
          }, wallTimeMs),
          signal: runOptions.signal,
          settled: false,
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

        try {
          // oxlint-disable-next-line unicorn/require-post-message-target-origin -- Web Worker postMessage has no targetOrigin parameter.
          ensureWorker().postMessage({ type: "run", request });
        } catch {
          interruptActive("Browser Python runtime is unavailable.");
        }
      });
    },
    async cancel(runId) {
      if (active?.request.runId !== runId) return;
      interruptActive("Python execution was cancelled.");
    },
    dispose() {
      if (active) interruptActive("Python execution was cancelled.");
      else terminateWorker();
    },
  };
}

function createModuleWorker(): PyodideWorkerLike {
  return new Worker(new URL("./pyodideRunner.worker.ts", import.meta.url), {
    type: "module",
    name: "dsa-python-runner",
  });
}

function isWorkerResult(
  value: unknown,
  runId: string,
): value is {
  readonly type: "result";
  readonly runId: string;
  readonly result: PythonRunResult;
} {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  const result = message.result;
  return (
    message.type === "result" &&
    message.runId === runId &&
    typeof result === "object" &&
    result !== null &&
    (result as Record<string, unknown>).runId === runId &&
    (result as Record<string, unknown>).runtime === "browser"
  );
}
