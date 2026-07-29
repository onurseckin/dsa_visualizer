import { isJsonValue } from "./json.ts";
import type {
  PythonCancelRequest,
  PythonExecutionLimits,
  PythonExecutionSpec,
  PythonRunRequest,
} from "./index.ts";

export const DEFAULT_PYTHON_EXECUTION_LIMITS: Readonly<PythonExecutionLimits> = {
  wallTimeMs: 10_000,
  maxSourceBytes: 64 * 1024,
  maxInputBytes: 256 * 1024,
  maxOutputBytes: 64 * 1024,
  maxResultBytes: 256 * 1024,
  maxCases: 100,
};

export const PYTHON_EXECUTION_POLICY_CEILINGS: Readonly<PythonExecutionLimits> = Object.freeze({
  wallTimeMs: 30_000,
  maxSourceBytes: 256 * 1024,
  maxInputBytes: 1024 * 1024,
  maxOutputBytes: 256 * 1024,
  maxResultBytes: 1024 * 1024,
  maxCases: 250,
});

export const PYTHON_RUN_REQUEST_BODY_CEILING_BYTES = 5 * 1024 * 1024;
export const PYTHON_RUN_ID_MAX_BYTES = 128;
export const PYTHON_CASE_ID_MAX_BYTES = 96;
export const PYTHON_ID_PATTERN_SOURCE = "[A-Za-z0-9._:-]+";
export const PYTHON_CANCEL_REQUEST_BODY_CEILING_BYTES = PYTHON_RUN_ID_MAX_BYTES + 128;
export const PYTHON_INVOCATION_PATH_MAX_SEGMENTS = 32;
export const PYTHON_INVOCATION_SETUP_MAX_STEPS = 32;
export const PYTHON_OUTPUT_CONTRACT_MAX_BYTES = 2_048;
const PYTHON_INVOCATION_PATH_STRING_MAX_BYTES = 128;

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PYTHON_ID_PATTERN = new RegExp(`^(?:${PYTHON_ID_PATTERN_SOURCE})$`);
const PYTHON_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

export function validatePythonExecutionSpec(input: unknown): ValidationResult<PythonExecutionSpec> {
  return safely(() => {
    const issues: ValidationIssue[] = [];
    validateUtf8Strings(input, "$", issues);
    validateSpec(input, "$", issues);
    return result(input, issues);
  });
}

export function validatePythonRunRequest(input: unknown): ValidationResult<PythonRunRequest> {
  return safely(() => {
    const issues: ValidationIssue[] = [];
    validateUtf8Strings(input, "$", issues);
    if (!isRecord(input)) {
      issue(issues, "$", "must be an object");
      return result(input, issues);
    }

    if (!isPythonRunId(input.runId)) {
      issue(
        issues,
        "$.runId",
        `must be a canonical ID of at most ${PYTHON_RUN_ID_MAX_BYTES} bytes`,
      );
    }
    if (typeof input.code !== "string") issue(issues, "$.code", "must be a string");

    validateSpec(input.spec, "$.spec", issues, input.caseIds);
    if (isRecord(input.spec) && typeof input.code === "string") {
      const limits = parsedLimits(input.spec.limits);
      const sourceBytes = utf8ByteLength(input.code);
      if (limits && sourceBytes !== undefined && sourceBytes > limits.maxSourceBytes) {
        issue(issues, "$.code", "exceeds maxSourceBytes");
      }
    }

    validateCaseSelection(input.caseIds, input.spec, issues);
    const bodyBytes = serializedJsonByteLength(input);
    if (bodyBytes === undefined) {
      issue(issues, "$", "must be safely serializable");
    } else if (bodyBytes > PYTHON_RUN_REQUEST_BODY_CEILING_BYTES) {
      issue(issues, "$", "exceeds the Python run request body ceiling");
    }
    return result(input, issues);
  });
}

export function validatePythonCancelRequest(input: unknown): ValidationResult<PythonCancelRequest> {
  return safely(() => {
    const issues: ValidationIssue[] = [];
    if (!isRecord(input)) {
      issue(issues, "$", "must be an object");
      return result(input, issues);
    }
    if (!isPythonRunId(input.runId)) {
      issue(
        issues,
        "$.runId",
        `must be a canonical ID of at most ${PYTHON_RUN_ID_MAX_BYTES} bytes`,
      );
    }
    return result(input, issues);
  });
}

function validateSpec(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  selection?: unknown,
): void {
  if (!isRecord(input)) {
    issue(issues, path, "must be an object");
    return;
  }

  if (input.runtime !== "browser" && input.runtime !== "server") {
    issue(issues, `${path}.runtime`, "must be browser or server");
  }
  if (!isPythonIdentifier(input.entrypoint)) {
    issue(issues, `${path}.entrypoint`, "must be a non-keyword Python identifier");
  }
  if (input.outputContract !== undefined) {
    const outputContractBytes =
      typeof input.outputContract === "string" ? utf8ByteLength(input.outputContract) : undefined;
    if (typeof input.outputContract !== "string" || input.outputContract.trim().length === 0) {
      issue(issues, `${path}.outputContract`, "must be a non-empty string");
    } else if (
      outputContractBytes === undefined ||
      outputContractBytes > PYTHON_OUTPUT_CONTRACT_MAX_BYTES
    ) {
      issue(
        issues,
        `${path}.outputContract`,
        `must be at most ${PYTHON_OUTPUT_CONTRACT_MAX_BYTES} UTF-8 bytes`,
      );
    }
  }

  validateInvocation(input.invocation, `${path}.invocation`, issues);
  validatePackages(input.packages, input.runtime, `${path}.packages`, issues);
  const limits = validateLimits(input.limits, `${path}.limits`, issues);
  const requiresStringInput = isRecord(input.invocation) && input.invocation.kind === "stdin";
  validateCases(input.cases, limits, requiresStringInput, `${path}.cases`, issues, selection);
}

function validateInvocation(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(input)) {
    issue(issues, path, "must be an object");
    return;
  }

  if (input.kind === "function") {
    validateBindings(input.arguments, `${path}.arguments`, issues, false);
    validateResultSelection(input.result, `${path}.result`, issues, false);
    return;
  }
  if (input.kind === "class-method") {
    validateBindings(input.constructor, `${path}.constructor`, issues, false);
    validateSetup(input.setup, `${path}.setup`, issues);
    validateBindings(input.arguments, `${path}.arguments`, issues, true);
    if (!isPublicPythonIdentifier(input.method)) {
      issue(issues, `${path}.method`, "must be a non-keyword Python identifier");
    }
    validateResultSelection(input.result, `${path}.result`, issues, true);
    return;
  }
  if (input.kind === "stdin") {
    if (input.output !== "text") issue(issues, `${path}.output`, "must be text");
    return;
  }
  issue(issues, `${path}.kind`, "must be function, class-method, or stdin");
}

function validateSetup(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (input === undefined) return;
  if (!Array.isArray(input)) {
    issue(issues, path, "must be an array");
    return;
  }
  if (input.length > PYTHON_INVOCATION_SETUP_MAX_STEPS) {
    issue(issues, path, `must contain at most ${PYTHON_INVOCATION_SETUP_MAX_STEPS} steps`);
  }
  input.forEach((step, index) => {
    const stepPath = `${path}[${index}]`;
    if (!isRecord(step)) {
      issue(issues, stepPath, "must be an object");
      return;
    }
    if (!isPublicPythonIdentifier(step.method)) {
      issue(issues, `${stepPath}.method`, "must be a public non-keyword Python identifier");
    }
    validateBindings(step.arguments, `${stepPath}.arguments`, issues, true);
  });
}

function validateResultSelection(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  allowInstance: boolean,
): void {
  if (input === undefined) return;
  if (!isRecord(input)) {
    issue(issues, path, "must be an object");
    return;
  }
  if (
    input.from !== "return" &&
    input.from !== "input" &&
    !(allowInstance && input.from === "instance")
  ) {
    issue(
      issues,
      `${path}.from`,
      allowInstance ? "must be return, input, or instance" : "must be return or input",
    );
  }
  validateValuePath(input.path, `${path}.path`, issues);
  if (input.project !== undefined && input.project !== "json") {
    issue(issues, `${path}.project`, "must be json");
  }
}

function validateBindings(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  allowInstance: boolean,
): void {
  if (!Array.isArray(input)) {
    issue(issues, path, "must be an array");
    return;
  }
  input.forEach((binding, index) => {
    const bindingPath = `${path}[${index}]`;
    if (!isRecord(binding)) {
      issue(issues, bindingPath, "must be an object");
      return;
    }
    if (binding.from !== "input" && !(allowInstance && binding.from === "instance")) {
      issue(
        issues,
        `${bindingPath}.from`,
        allowInstance ? "must be input or instance" : "must be input",
      );
    }
    validateValuePath(binding.path, `${bindingPath}.path`, issues);
    if (binding.from === "input") {
      if (binding.convert !== undefined && binding.convert !== "namespace") {
        issue(issues, `${bindingPath}.convert`, "must be namespace");
      }
    } else if (binding.convert !== undefined) {
      issue(issues, `${bindingPath}.convert`, "is only supported for input bindings");
    }
  });
}

function validateValuePath(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(input)) {
    issue(issues, path, "must be an array");
    return;
  }
  if (input.length > PYTHON_INVOCATION_PATH_MAX_SEGMENTS) {
    issue(issues, path, `must contain at most ${PYTHON_INVOCATION_PATH_MAX_SEGMENTS} segments`);
  }
  input.forEach((segment, segmentIndex) => {
    const segmentPath = `${path}[${segmentIndex}]`;
    if (typeof segment === "string") {
      const bytes = utf8ByteLength(segment);
      if (
        !isPublicPythonPathSegment(segment) ||
        bytes === undefined ||
        bytes > PYTHON_INVOCATION_PATH_STRING_MAX_BYTES
      ) {
        issue(issues, segmentPath, "must be a bounded public identifier segment");
      }
    } else if (!Number.isInteger(segment) || segment < 0) {
      issue(issues, segmentPath, "must be a string or non-negative integer");
    }
  });
}

function validatePackages(
  input: unknown,
  runtime: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(input)) {
    issue(issues, path, "must be an array");
    return;
  }
  const seen = new Set<string>();
  input.forEach((packageName, index) => {
    if (packageName !== "numpy" && packageName !== "torch") {
      issue(issues, `${path}[${index}]`, "must be numpy or torch");
      return;
    }
    if (seen.has(packageName)) issue(issues, `${path}[${index}]`, "must not contain duplicates");
    seen.add(packageName);
    if (runtime === "browser" && packageName === "torch") {
      issue(issues, `${path}[${index}]`, "torch requires the server runtime");
    }
  });
}

function validateLimits(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
): PythonExecutionLimits | undefined {
  if (input === undefined) return DEFAULT_PYTHON_EXECUTION_LIMITS;
  if (!isRecord(input)) {
    issue(issues, path, "must be an object");
    return undefined;
  }

  const names = Object.keys(DEFAULT_PYTHON_EXECUTION_LIMITS) as (keyof PythonExecutionLimits)[];
  let valid = true;
  for (const name of Object.keys(input)) {
    if (!names.includes(name as keyof PythonExecutionLimits)) {
      issue(issues, `${path}.${name}`, "is not a supported limit");
      valid = false;
    }
  }
  for (const name of names) {
    if (!Object.hasOwn(input, name)) continue;
    const value = input[name];
    const isCaseLimit = name === "maxCases";
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (isCaseLimit && !Number.isInteger(value))
    ) {
      issue(issues, `${path}.${name}`, "must be a positive finite number");
      valid = false;
    } else if (value > PYTHON_EXECUTION_POLICY_CEILINGS[name]) {
      issue(issues, `${path}.${name}`, "exceeds the server policy ceiling");
      valid = false;
    }
  }
  return valid ? parsedLimits(input) : undefined;
}

function parsedLimits(input: unknown): PythonExecutionLimits | undefined {
  if (input === undefined) return DEFAULT_PYTHON_EXECUTION_LIMITS;
  if (!isRecord(input)) return undefined;
  const names = Object.keys(DEFAULT_PYTHON_EXECUTION_LIMITS) as (keyof PythonExecutionLimits)[];
  if (Object.keys(input).some((name) => !names.includes(name as keyof PythonExecutionLimits))) {
    return undefined;
  }

  const overrides: { -readonly [Name in keyof PythonExecutionLimits]?: number } = {};
  for (const name of names) {
    if (!Object.hasOwn(input, name)) continue;
    const value = input[name];
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0 &&
      (name !== "maxCases" || Number.isInteger(value)) &&
      value <= PYTHON_EXECUTION_POLICY_CEILINGS[name]
    ) {
      overrides[name] = value;
      continue;
    }
    return undefined;
  }
  return { ...DEFAULT_PYTHON_EXECUTION_LIMITS, ...overrides };
}

function validateCases(
  input: unknown,
  limits: PythonExecutionLimits | undefined,
  requiresStringInput: boolean,
  path: string,
  issues: ValidationIssue[],
  selection?: unknown,
): void {
  if (!Array.isArray(input) || input.length === 0) {
    issue(issues, path, "must be a non-empty array");
    return;
  }
  if (limits && input.length > limits.maxCases) issue(issues, path, "exceeds maxCases");

  const ids = new Set<string>();
  const selectedIds =
    selection === undefined ? undefined : new Set(Array.isArray(selection) ? selection : []);
  let inputBytes = 0;
  let expectedBytes = 0;
  let expectedStdoutBytes = 0;
  input.forEach((testCase, index) => {
    const casePath = `${path}[${index}]`;
    if (!isRecord(testCase)) {
      issue(issues, casePath, "must be an object");
      return;
    }
    if (!isPythonCaseId(testCase.id)) {
      issue(
        issues,
        `${casePath}.id`,
        `must be a canonical ID of at most ${PYTHON_CASE_ID_MAX_BYTES} bytes`,
      );
    } else if (ids.has(testCase.id)) {
      issue(issues, `${casePath}.id`, "must be unique");
    } else {
      ids.add(testCase.id);
    }
    if (!isNonEmptyString(testCase.label))
      issue(issues, `${casePath}.label`, "must be a non-empty string");
    const caseInput = testCase.input;
    const expected = testCase.expected;
    if (!isJsonValue(caseInput)) issue(issues, `${casePath}.input`, "must be a JSON value");
    if (!isJsonValue(expected)) issue(issues, `${casePath}.expected`, "must be a JSON value");

    if (requiresStringInput && typeof caseInput !== "string") {
      issue(issues, `${casePath}.input`, "must be a string for stdin invocation");
    }

    if (
      testCase.comparison !== "deep-equal" &&
      testCase.comparison !== "unordered" &&
      testCase.comparison !== "unordered-outer" &&
      testCase.comparison !== "float" &&
      testCase.comparison !== "stdout"
    ) {
      issue(issues, `${casePath}.comparison`, "is not supported");
    }
    if (testCase.comparison === "unordered-outer" && !Array.isArray(expected)) {
      issue(issues, `${casePath}.expected`, "must be an array for unordered-outer comparison");
    } else if (testCase.comparison === "float") {
      if (typeof expected !== "number" || !Number.isFinite(expected)) {
        issue(issues, `${casePath}.expected`, "must be a finite number for float comparison");
      }
      if (
        typeof testCase.tolerance !== "number" ||
        !Number.isFinite(testCase.tolerance) ||
        testCase.tolerance < 0
      ) {
        issue(
          issues,
          `${casePath}.tolerance`,
          "must be a non-negative finite number for float comparison",
        );
      }
    } else if (testCase.comparison === "stdout" && typeof expected !== "string") {
      issue(issues, `${casePath}.expected`, "must be a string for stdout comparison");
    } else if (testCase.tolerance !== undefined) {
      issue(issues, `${casePath}.tolerance`, "is only allowed for float comparison");
    }

    if (isJsonValue(caseInput)) {
      const size = serializedJsonByteLength(caseInput);
      if (size === undefined) issue(issues, `${casePath}.input`, "must be safely serializable");
      else inputBytes += size;
    }
    if (isJsonValue(expected)) {
      const size = serializedJsonByteLength(expected);
      if (size === undefined) issue(issues, `${casePath}.expected`, "must be safely serializable");
      else expectedBytes += size;
    }
    if (
      testCase.comparison === "stdout" &&
      typeof expected === "string" &&
      (selectedIds === undefined || selectedIds.has(testCase.id))
    ) {
      expectedStdoutBytes += utf8ByteLength(expected) ?? 0;
    }
  });

  if (limits && inputBytes > limits.maxInputBytes)
    issue(issues, path, "inputs exceed maxInputBytes");
  if (limits && expectedBytes > limits.maxResultBytes)
    issue(issues, path, "expected values exceed maxResultBytes");
  if (limits && expectedStdoutBytes > limits.maxOutputBytes)
    issue(issues, path, "expected stdout exceeds maxOutputBytes");
}

function validateCaseSelection(selection: unknown, spec: unknown, issues: ValidationIssue[]): void {
  if (selection === undefined) return;
  if (!Array.isArray(selection) || selection.length === 0) {
    issue(issues, "$.caseIds", "must be a non-empty array when provided");
    return;
  }
  const available =
    isRecord(spec) && Array.isArray(spec.cases)
      ? new Set(spec.cases.filter(isRecord).map((testCase) => testCase.id))
      : new Set<unknown>();
  const selected = new Set<string>();
  selection.forEach((id, index) => {
    if (!isPythonCaseId(id)) {
      issue(
        issues,
        `$.caseIds[${index}]`,
        `must be a canonical ID of at most ${PYTHON_CASE_ID_MAX_BYTES} bytes`,
      );
    } else if (selected.has(id)) {
      issue(issues, `$.caseIds[${index}]`, "must not contain duplicates");
    } else if (!available.has(id)) {
      issue(issues, `$.caseIds[${index}]`, "must reference a case in spec.cases");
    }
    if (typeof id === "string") selected.add(id);
  });
}

function isPythonIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value) && !PYTHON_KEYWORDS.has(value);
}

function isPublicPythonIdentifier(value: unknown): value is string {
  return isPythonIdentifier(value) && !value.startsWith("_");
}

function isPublicPythonPathSegment(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value) && !value.startsWith("_");
}

export function isPythonRunId(value: unknown): value is string {
  return isBoundedPythonId(value, PYTHON_RUN_ID_MAX_BYTES);
}

export function isPythonCaseId(value: unknown): value is string {
  return isBoundedPythonId(value, PYTHON_CASE_ID_MAX_BYTES);
}

function isBoundedPythonId(value: unknown, maxBytes: number): value is string {
  if (typeof value !== "string" || !PYTHON_ID_PATTERN.test(value)) return false;
  const bytes = utf8ByteLength(value);
  return bytes !== undefined && bytes <= maxBytes;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8ByteLength(value: string): number | undefined {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      if (index + 1 >= value.length) return undefined;
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return undefined;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return undefined;
    }
  }
  return new TextEncoder().encode(value).byteLength;
}

function validateUtf8Strings(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  seen = new WeakSet<object>(),
): void {
  if (typeof value === "string") {
    if (utf8ByteLength(value) === undefined) issue(issues, path, "must be valid UTF-8 text");
    return;
  }
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateUtf8Strings(item, `${path}[${index}]`, issues, seen));
    return;
  }
  for (const key of Object.keys(value)) {
    if (utf8ByteLength(key) === undefined)
      issue(issues, path, "property names must be valid UTF-8 text");
    validateUtf8Strings((value as Record<string, unknown>)[key], `${path}.${key}`, issues, seen);
  }
}

function serializedJsonByteLength(value: unknown): number | undefined {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? utf8ByteLength(serialized) : undefined;
  } catch {
    return undefined;
  }
}

function issue(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function result<T>(input: unknown, issues: readonly ValidationIssue[]): ValidationResult<T> {
  return issues.length === 0 ? { ok: true, value: input as T } : { ok: false, issues };
}

function safely<T>(validate: () => ValidationResult<T>): ValidationResult<T> {
  try {
    return validate();
  } catch {
    return {
      ok: false,
      issues: [{ path: "$", message: "must be a readable JSON-compatible payload" }],
    };
  }
}
