import type {
  PythonExecutionStatus,
  PythonRunRequest,
  PythonRunResult,
  PythonRuntime,
  ValidationIssue,
  ValidationResult,
} from "@dsa-visualizer/execution-contracts";
import { DEFAULT_PYTHON_EXECUTION_LIMITS } from "@dsa-visualizer/execution-contracts";

export type PythonRuntimePreference = "auto" | PythonRuntime;

export const PYTHON_RUNNER_INFRASTRUCTURE_ERRORS = Object.freeze({
  browserInvalidResponse: "Browser Python runtime returned an invalid response.",
  browserUnavailable: "Browser Python runtime is unavailable.",
  serverInvalidResponse: "Python runner returned an invalid response.",
  serverUnavailable: "Python runner is unavailable.",
});

export const BROWSER_INITIALIZATION_TIMEOUT_PREFIX =
  "Browser Python runtime initialization exceeded the ";

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

export function browserInitializationTimeoutMessage(timeoutMs: number): string {
  return `${BROWSER_INITIALIZATION_TIMEOUT_PREFIX}${timeoutMs} ms timeout.`;
}

export function isPythonRunnerInfrastructureFailure(result: PythonRunResult): boolean {
  if (result.status !== "error" || result.cases.length > 0) return false;
  if (result.runtime === "browser") {
    return (
      result.stderr === PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.browserUnavailable ||
      result.stderr === PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.browserInvalidResponse ||
      result.stderr.startsWith(BROWSER_INITIALIZATION_TIMEOUT_PREFIX)
    );
  }
  return (
    result.stderr === PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverUnavailable ||
    result.stderr === PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.serverInvalidResponse
  );
}

export function createPythonRunRequestSnapshot(request: PythonRunRequest): PythonRunRequest {
  const serialized = JSON.stringify(request);
  if (typeof serialized !== "string") {
    throw new TypeError("Validated Python run request could not be serialized.");
  }
  const snapshot = JSON.parse(serialized) as PythonRunRequest;
  const pending: object[] = [snapshot];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || Object.isFrozen(current)) continue;
    for (const value of Object.values(current)) {
      if (typeof value === "object" && value !== null) pending.push(value);
    }
    Object.freeze(current);
  }
  return snapshot;
}

const RESULT_KEYS = new Set([
  "runId",
  "status",
  "stdout",
  "stderr",
  "cases",
  "durationMs",
  "runtime",
]);
const CASE_RESULT_KEYS = new Set(["id", "status", "stdout", "stderr", "durationMs", "actual"]);

type JsonMeasurementFrame =
  | { readonly kind: "value"; readonly value: unknown }
  | {
      readonly kind: "array";
      readonly value: readonly unknown[];
      readonly index: number;
    }
  | {
      readonly kind: "object";
      readonly value: Record<string, unknown>;
      readonly keys: readonly string[];
      readonly index: number;
    };

export function validatePythonRunResult(
  request: PythonRunRequest,
  candidate: unknown,
  expectedRuntime: PythonRuntime,
): ValidationResult<PythonRunResult> {
  try {
    const issue = validatePythonRunResultInternal(request, candidate, expectedRuntime);
    return issue
      ? { ok: false, issues: [issue] }
      : { ok: true, value: candidate as PythonRunResult };
  } catch {
    return invalidResult("$", "must be a readable bounded Python result");
  }
}

function validatePythonRunResultInternal(
  request: PythonRunRequest,
  candidate: unknown,
  expectedRuntime: PythonRuntime,
): ValidationIssue | undefined {
  if (!isRecord(candidate) || !hasOnlyKeys(candidate, RESULT_KEYS)) {
    return issue("$", "must match the Python result schema");
  }
  if (
    candidate.runId !== request.runId ||
    candidate.runtime !== expectedRuntime ||
    !isExecutionStatus(candidate.status) ||
    typeof candidate.stdout !== "string" ||
    typeof candidate.stderr !== "string" ||
    !Array.isArray(candidate.cases) ||
    !isNonNegativeFiniteNumber(candidate.durationMs)
  ) {
    return issue("$", "contains an invalid Python result field");
  }

  const limits = {
    ...DEFAULT_PYTHON_EXECUTION_LIMITS,
    ...request.spec.limits,
  };
  const selectedIds = request.caseIds ?? request.spec.cases.map((testCase) => testCase.id);
  if (candidate.cases.length > limits.maxCases || candidate.cases.length > selectedIds.length) {
    return issue("$.cases", "exceeds the authored case envelope");
  }

  const expectedIds = new Set(selectedIds);
  const returnedIds = new Set<string>();
  const stdoutParts: string[] = [];
  const stderrParts: string[] = [];
  const statuses: PythonExecutionStatus[] = [];
  let outputBytes = 0;
  let resultBytes = 0;

  for (let index = 0; index < candidate.cases.length; index += 1) {
    const caseResult = candidate.cases[index];
    const path = `$.cases[${index}]`;
    if (!isRecord(caseResult) || !hasOnlyKeys(caseResult, CASE_RESULT_KEYS)) {
      return issue(path, "must match the Python case result schema");
    }
    if (
      typeof caseResult.id !== "string" ||
      !expectedIds.has(caseResult.id) ||
      returnedIds.has(caseResult.id)
    ) {
      return issue(`${path}.id`, "must be a unique selected authored case ID");
    }
    if (
      !isExecutionStatus(caseResult.status) ||
      typeof caseResult.stdout !== "string" ||
      typeof caseResult.stderr !== "string" ||
      !isNonNegativeFiniteNumber(caseResult.durationMs)
    ) {
      return issue(path, "contains an invalid Python case result field");
    }

    const stdoutBytes = boundedUtf8ByteLength(
      caseResult.stdout,
      limits.maxOutputBytes - outputBytes,
    );
    if (stdoutBytes === undefined || stdoutBytes > limits.maxOutputBytes - outputBytes) {
      return issue(path, "exceeds maxOutputBytes");
    }
    outputBytes += stdoutBytes;
    const stderrBytes = boundedUtf8ByteLength(
      caseResult.stderr,
      limits.maxOutputBytes - outputBytes,
    );
    if (stderrBytes === undefined || stderrBytes > limits.maxOutputBytes - outputBytes) {
      return issue(path, "exceeds maxOutputBytes");
    }
    outputBytes += stderrBytes;

    const hasActual = Object.hasOwn(caseResult, "actual");
    if ((caseResult.status === "passed" || caseResult.status === "failed") && !hasActual) {
      return issue(`${path}.actual`, "is required for a completed case");
    }
    if (hasActual) {
      const actualBytes = boundedJsonByteLength(
        caseResult.actual,
        limits.maxResultBytes - resultBytes,
      );
      if (actualBytes === undefined || actualBytes > limits.maxResultBytes - resultBytes) {
        return issue(`${path}.actual`, "must fit the authored JSON result envelope");
      }
      resultBytes += actualBytes;
    }

    returnedIds.add(caseResult.id);
    stdoutParts.push(caseResult.stdout);
    stderrParts.push(caseResult.stderr);
    statuses.push(caseResult.status);
  }

  const topLevelOutputBytes = boundedUtf8ByteLength(candidate.stdout, limits.maxOutputBytes);
  if (topLevelOutputBytes === undefined || topLevelOutputBytes > limits.maxOutputBytes) {
    return issue("$.stdout", "exceeds maxOutputBytes");
  }
  const topLevelErrorBytes = boundedUtf8ByteLength(
    candidate.stderr,
    limits.maxOutputBytes - topLevelOutputBytes,
  );
  if (
    topLevelErrorBytes === undefined ||
    topLevelErrorBytes > limits.maxOutputBytes - topLevelOutputBytes
  ) {
    return issue("$.stderr", "exceeds maxOutputBytes");
  }

  if (candidate.cases.length === 0) {
    if (candidate.status !== "error" && candidate.status !== "timeout") {
      return issue("$.status", "must describe a run-level error or timeout");
    }
    return undefined;
  }
  if (candidate.cases.length !== selectedIds.length || returnedIds.size !== expectedIds.size) {
    return issue("$.cases", "must contain every selected authored case");
  }
  if (
    !aggregateMatchesParts(candidate.stdout, stdoutParts) ||
    !aggregateMatchesParts(candidate.stderr, stderrParts)
  ) {
    return issue("$", "aggregate output must equal the case output");
  }
  if (candidate.status !== overallStatus(statuses)) {
    return issue("$.status", "must agree with the case statuses");
  }
  return undefined;
}

function overallStatus(statuses: readonly PythonExecutionStatus[]): PythonExecutionStatus {
  if (statuses.includes("timeout")) return "timeout";
  if (statuses.includes("error")) return "error";
  if (statuses.includes("failed")) return "failed";
  return "passed";
}

function aggregateMatchesParts(aggregate: string, parts: readonly string[]): boolean {
  let offset = 0;
  for (const part of parts) {
    if (!aggregate.startsWith(part, offset)) return false;
    offset += part.length;
  }
  return offset === aggregate.length;
}

function boundedJsonByteLength(value: unknown, limit: number): number | undefined {
  if (limit < 0) return limit + 1;
  let size = 0;
  const ancestors = new WeakSet<object>();
  const frames: JsonMeasurementFrame[] = [{ kind: "value", value }];
  const add = (bytes: number) => {
    size += bytes;
    return size <= limit;
  };

  while (frames.length > 0) {
    const frame = frames.pop();
    if (!frame) break;

    if (frame.kind === "array") {
      if (frame.index >= frame.value.length) {
        ancestors.delete(frame.value);
        continue;
      }
      if (!Object.hasOwn(frame.value, frame.index)) return undefined;
      if (frame.index > 0 && !add(1)) return limit + 1;
      frames.push({ ...frame, index: frame.index + 1 });
      frames.push({ kind: "value", value: frame.value[frame.index] });
      continue;
    }

    if (frame.kind === "object") {
      if (frame.index >= frame.keys.length) {
        ancestors.delete(frame.value);
        continue;
      }
      if (frame.index > 0 && !add(1)) return limit + 1;
      const key = frame.keys[frame.index];
      const keyBytes = boundedJsonStringByteLength(key, limit - size);
      if (keyBytes === undefined) return undefined;
      if (!add(keyBytes + 1)) return limit + 1;
      frames.push({ ...frame, index: frame.index + 1 });
      frames.push({ kind: "value", value: frame.value[key] });
      continue;
    }

    const current = frame.value;
    if (current === null) {
      if (!add(4)) return limit + 1;
      continue;
    }
    if (typeof current === "boolean") {
      if (!add(current ? 4 : 5)) return limit + 1;
      continue;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) return undefined;
      if (!add(String(Object.is(current, -0) ? 0 : current).length)) return limit + 1;
      continue;
    }
    if (typeof current === "string") {
      const stringBytes = boundedJsonStringByteLength(current, limit - size);
      if (stringBytes === undefined) return undefined;
      if (!add(stringBytes)) return limit + 1;
      continue;
    }
    if (typeof current !== "object" || current === null || ancestors.has(current)) {
      return undefined;
    }

    if (Array.isArray(current)) {
      if (!add(2)) return limit + 1;
      ancestors.add(current);
      frames.push({ kind: "array", value: current, index: 0 });
      continue;
    }
    const prototype = Object.getPrototypeOf(current);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const record = current as Record<string, unknown>;
    const keys = Object.keys(record);
    if (!add(2)) return limit + 1;
    ancestors.add(record);
    frames.push({ kind: "object", value: record, keys, index: 0 });
  }
  return size;
}

function boundedJsonStringByteLength(value: string, limit: number): number | undefined {
  let bytes = 2;
  if (bytes > limit) return limit + 1;
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (
      codeUnit === 0x22 ||
      codeUnit === 0x5c ||
      codeUnit === 0x08 ||
      codeUnit === 0x09 ||
      codeUnit === 0x0a ||
      codeUnit === 0x0c ||
      codeUnit === 0x0d
    ) {
      bytes += 2;
    } else if (codeUnit < 0x20) {
      bytes += 6;
    } else if (codeUnit < 0x80) {
      bytes += 1;
    } else if (codeUnit < 0x800) {
      bytes += 2;
    } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return undefined;
      bytes += 4;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return undefined;
    } else {
      bytes += 3;
    }
    if (bytes > limit) return limit + 1;
  }
  return bytes;
}

function boundedUtf8ByteLength(value: string, limit: number): number | undefined {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit < 0x80) {
      bytes += 1;
    } else if (codeUnit < 0x800) {
      bytes += 2;
    } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return undefined;
      bytes += 4;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return undefined;
    } else {
      bytes += 3;
    }
    if (bytes > limit) return limit + 1;
  }
  return bytes;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  const keys = Reflect.ownKeys(value);
  return keys.every((key) => typeof key === "string" && allowed.has(key));
}

function isExecutionStatus(value: unknown): value is PythonExecutionStatus {
  return value === "passed" || value === "failed" || value === "error" || value === "timeout";
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function invalidResult(
  path: string,
  message: string,
): Extract<ValidationResult<PythonRunResult>, { ok: false }> {
  return { ok: false, issues: [issue(path, message)] };
}
