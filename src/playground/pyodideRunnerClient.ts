import {
  DEFAULT_PYTHON_EXECUTION_LIMITS,
  validatePythonRunRequest,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { isBrowserCompatible } from "./runnerSelector";
import {
  executionErrorResult,
  type PythonRunner,
  type PythonRunnerRunOptions,
  validatePythonRunResult,
} from "./types";

export const DEFAULT_PYODIDE_INITIALIZATION_TIMEOUT_MS = 60_000;
export const PYODIDE_INITIALIZATION_TIMEOUT_CAP_MS = 120_000;

export interface PyodideWorkerLike {
  addEventListener(type: "error" | "message", listener: EventListenerOrEventListenerObject): void;
  postMessage(value: unknown): void;
  terminate(): void;
}

export interface PyodideRunnerClientOptions {
  readonly createWorker?: () => PyodideWorkerLike;
  readonly initializationTimeoutMs?: number;
}

interface ActiveBrowserRun {
  readonly request: PythonRunRequest;
  readonly resolve: (result: PythonRunResult) => void;
  readonly startedAt: number;
  readonly token: string;
  readonly worker: PyodideWorkerLike;
  readonly signal?: AbortSignal;
  readonly abortListener?: () => void;
  phase: "initializing" | "running";
  settled: boolean;
  timeout: ReturnType<typeof setTimeout>;
}

export function createPyodideRunnerClient(options: PyodideRunnerClientOptions = {}): PythonRunner {
  const createWorker = options.createWorker ?? createModuleWorker;
  const initializationTimeoutMs = normalizedInitializationTimeout(options.initializationTimeoutMs);
  let worker: PyodideWorkerLike | undefined;
  let active: ActiveBrowserRun | undefined;
  let generation = 0;

  const terminateWorker = (target = worker) => {
    target?.terminate();
    if (worker === target) worker = undefined;
  };

  const settle = (record: ActiveBrowserRun, result: PythonRunResult, terminate = false) => {
    if (record.settled) return;
    record.settled = true;
    clearTimeout(record.timeout);
    if (record.abortListener) {
      record.signal?.removeEventListener("abort", record.abortListener);
    }
    if (active === record) active = undefined;
    if (terminate) terminateWorker(record.worker);
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
      const record = active;
      if (!record || record.worker !== created || !isCurrentEnvelope(message, record)) return;
      if (isWorkerReady(message)) {
        if (record.phase !== "initializing") return;
        clearTimeout(record.timeout);
        record.phase = "running";
        const wallTimeMs =
          record.request.spec.limits?.wallTimeMs ?? DEFAULT_PYTHON_EXECUTION_LIMITS.wallTimeMs;
        record.timeout = setTimeout(() => {
          if (active !== record) return;
          interruptActive(
            `Browser Python execution exceeded the ${wallTimeMs} ms timeout.`,
            "timeout",
          );
        }, wallTimeMs);
        return;
      }
      if (!isWorkerResult(message)) return;
      const validation = validatePythonRunResult(record.request, message.result, "browser");
      if (!validation.ok) {
        settle(
          record,
          executionErrorResult(
            record.request.runId,
            "browser",
            "Browser Python runtime returned an invalid response.",
            "error",
            Date.now() - record.startedAt,
          ),
          true,
        );
        return;
      }
      settle(record, validation.value);
    });
    created.addEventListener("error", () => {
      if (!active || active.worker !== created) return;
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
      const browserRequest: PythonRunRequest = {
        ...request,
        spec: { ...request.spec, runtime: "browser" },
      };
      const validation = validatePythonRunRequest(browserRequest);
      if (!validation.ok) {
        return Promise.resolve(
          executionErrorResult(request.runId, "browser", "Python execution request is invalid."),
        );
      }
      if (!isBrowserCompatible(validation.value.spec)) {
        return Promise.resolve(
          executionErrorResult(
            request.runId,
            "browser",
            "This exercise requires the server Python runtime.",
          ),
        );
      }
      let selectedWorker: PyodideWorkerLike;
      try {
        selectedWorker = ensureWorker();
      } catch {
        return Promise.resolve(
          executionErrorResult(request.runId, "browser", "Browser Python runtime is unavailable."),
        );
      }

      return new Promise<PythonRunResult>((resolve) => {
        const startedAt = Date.now();
        const token = `browser-run-${++generation}`;
        const record: ActiveBrowserRun = {
          request: validation.value,
          resolve,
          startedAt,
          token,
          worker: selectedWorker,
          phase: "initializing",
          timeout: setTimeout(() => {
            if (active !== record) return;
            interruptActive(
              `Browser Python runtime initialization exceeded the ${initializationTimeoutMs} ms timeout.`,
            );
          }, initializationTimeoutMs),
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
          // oxlint-disable unicorn/require-post-message-target-origin -- Web Worker postMessage has no targetOrigin parameter.
          selectedWorker.postMessage({
            type: "run",
            request: validation.value,
            token,
          });
          // oxlint-enable unicorn/require-post-message-target-origin
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

function normalizedInitializationTimeout(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_PYODIDE_INITIALIZATION_TIMEOUT_MS;
  }
  return Math.min(Math.round(value), PYODIDE_INITIALIZATION_TIMEOUT_CAP_MS);
}

function isCurrentEnvelope(
  value: unknown,
  record: ActiveBrowserRun,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return message.runId === record.request.runId && message.token === record.token;
}

function isWorkerReady(value: Record<string, unknown>): boolean {
  return value.type === "ready";
}

function isWorkerResult(value: Record<string, unknown>): value is {
  readonly type: "result";
  readonly runId: string;
  readonly token: string;
  readonly result: PythonRunResult;
} {
  return value.type === "result" && Object.hasOwn(value, "result");
}
