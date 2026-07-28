import { isJsonValue } from "./json";
import type { PythonExecutionLimits, PythonExecutionSpec, PythonRunRequest } from "./index";

export const DEFAULT_PYTHON_EXECUTION_LIMITS: Readonly<PythonExecutionLimits> = {
  wallTimeMs: 10_000,
  maxSourceBytes: 64 * 1024,
  maxInputBytes: 256 * 1024,
  maxOutputBytes: 64 * 1024,
  maxResultBytes: 256 * 1024,
  maxCases: 100,
};

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
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
    validateSpec(input, "$", issues);
    return result(input, issues);
  });
}

export function validatePythonRunRequest(input: unknown): ValidationResult<PythonRunRequest> {
  return safely(() => {
    const issues: ValidationIssue[] = [];
    if (!isRecord(input)) {
      issue(issues, "$", "must be an object");
      return result(input, issues);
    }

    if (!isNonEmptyString(input.runId)) issue(issues, "$.runId", "must be a non-empty string");
    if (typeof input.code !== "string") issue(issues, "$.code", "must be a string");

    validateSpec(input.spec, "$.spec", issues);
    if (isRecord(input.spec) && typeof input.code === "string") {
      const limits = parsedLimits(input.spec.limits);
      if (limits && byteLength(input.code) > limits.maxSourceBytes) {
        issue(issues, "$.code", "exceeds maxSourceBytes");
      }
    }

    validateCaseSelection(input.caseIds, input.spec, issues);
    return result(input, issues);
  });
}

function validateSpec(input: unknown, path: string, issues: ValidationIssue[]): void {
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

  validateInvocation(input.invocation, `${path}.invocation`, issues);
  validatePackages(input.packages, input.runtime, `${path}.packages`, issues);
  const limits = validateLimits(input.limits, `${path}.limits`, issues);
  validateCases(input.cases, limits, `${path}.cases`, issues);
}

function validateInvocation(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(input)) {
    issue(issues, path, "must be an object");
    return;
  }

  if (input.kind === "function") {
    validateBindings(input.arguments, `${path}.arguments`, issues);
    return;
  }
  if (input.kind === "class-method") {
    validateBindings(input.constructor, `${path}.constructor`, issues);
    validateBindings(input.arguments, `${path}.arguments`, issues);
    if (!isPythonIdentifier(input.method)) {
      issue(issues, `${path}.method`, "must be a non-keyword Python identifier");
    }
    return;
  }
  if (input.kind === "stdin") {
    if (input.output !== "text") issue(issues, `${path}.output`, "must be text");
    return;
  }
  issue(issues, `${path}.kind`, "must be function, class-method, or stdin");
}

function validateBindings(input: unknown, path: string, issues: ValidationIssue[]): void {
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
    if (binding.from !== "input") issue(issues, `${bindingPath}.from`, "must be input");
    if (!Array.isArray(binding.path)) {
      issue(issues, `${bindingPath}.path`, "must be an array");
      return;
    }
    binding.path.forEach((segment, segmentIndex) => {
      if (typeof segment !== "string" && (!Number.isInteger(segment) || segment < 0)) {
        issue(
          issues,
          `${bindingPath}.path[${segmentIndex}]`,
          "must be a string or non-negative integer",
        );
      }
    });
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
  for (const name of names) {
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
    }
  }
  return valid ? (input as unknown as PythonExecutionLimits) : undefined;
}

function parsedLimits(input: unknown): PythonExecutionLimits | undefined {
  if (input === undefined) return DEFAULT_PYTHON_EXECUTION_LIMITS;
  if (!isRecord(input)) return undefined;
  const values = Object.keys(DEFAULT_PYTHON_EXECUTION_LIMITS) as (keyof PythonExecutionLimits)[];
  return values.every((name) => {
    const value = input[name];
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value > 0 &&
      (name !== "maxCases" || Number.isInteger(value))
    );
  })
    ? (input as unknown as PythonExecutionLimits)
    : undefined;
}

function validateCases(
  input: unknown,
  limits: PythonExecutionLimits | undefined,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(input) || input.length === 0) {
    issue(issues, path, "must be a non-empty array");
    return;
  }
  if (limits && input.length > limits.maxCases) issue(issues, path, "exceeds maxCases");

  const ids = new Set<string>();
  let inputBytes = 0;
  input.forEach((testCase, index) => {
    const casePath = `${path}[${index}]`;
    if (!isRecord(testCase)) {
      issue(issues, casePath, "must be an object");
      return;
    }
    if (!isNonEmptyString(testCase.id)) {
      issue(issues, `${casePath}.id`, "must be a non-empty string");
    } else if (ids.has(testCase.id)) {
      issue(issues, `${casePath}.id`, "must be unique");
    } else {
      ids.add(testCase.id);
    }
    if (!isNonEmptyString(testCase.label))
      issue(issues, `${casePath}.label`, "must be a non-empty string");
    if (!isJsonValue(testCase.input)) issue(issues, `${casePath}.input`, "must be a JSON value");
    if (!isJsonValue(testCase.expected))
      issue(issues, `${casePath}.expected`, "must be a JSON value");

    if (
      testCase.comparison !== "deep-equal" &&
      testCase.comparison !== "unordered" &&
      testCase.comparison !== "float" &&
      testCase.comparison !== "stdout"
    ) {
      issue(issues, `${casePath}.comparison`, "is not supported");
    }
    if (testCase.comparison === "float") {
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
    } else if (testCase.tolerance !== undefined) {
      issue(issues, `${casePath}.tolerance`, "is only allowed for float comparison");
    }

    if (isJsonValue(testCase.input)) inputBytes += byteLength(JSON.stringify(testCase.input));
  });

  if (limits && inputBytes > limits.maxInputBytes)
    issue(issues, path, "inputs exceed maxInputBytes");
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
    if (!isNonEmptyString(id)) {
      issue(issues, `$.caseIds[${index}]`, "must be a non-empty string");
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
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
