export type { JsonObject, JsonPrimitive, JsonValue } from "./json.ts";
export { isJsonValue } from "./json.ts";

export type PythonRuntime = "browser" | "server";

export type PythonPackage = "numpy" | "torch";

export type PythonValuePath = readonly (number | string)[];

export type ValueBinding =
  | {
      readonly from: "input";
      readonly path: PythonValuePath;
      readonly convert?: "namespace";
    }
  | {
      readonly from: "instance";
      readonly path: PythonValuePath;
      readonly convert?: never;
    };

export interface PythonSetupCall {
  readonly method: string;
  readonly arguments: readonly ValueBinding[];
}

export interface PythonResultSelection {
  readonly from: "return" | "input" | "instance";
  readonly path: PythonValuePath;
  readonly project?: "json";
}

export type PythonInvocation =
  | {
      readonly kind: "function";
      readonly arguments: readonly ValueBinding[];
      readonly result?: PythonResultSelection;
    }
  | {
      readonly kind: "class-method";
      readonly constructor: readonly ValueBinding[];
      readonly setup?: readonly PythonSetupCall[];
      readonly method: string;
      readonly arguments: readonly ValueBinding[];
      readonly result?: PythonResultSelection;
    }
  | {
      readonly kind: "stdin";
      readonly output: "text";
    };

export interface PythonExecutionLimits {
  readonly wallTimeMs: number;
  readonly maxSourceBytes: number;
  readonly maxInputBytes: number;
  readonly maxOutputBytes: number;
  readonly maxResultBytes: number;
  readonly maxCases: number;
}

export type PythonComparison = "deep-equal" | "unordered" | "unordered-outer" | "float" | "stdout";

export interface PythonTestCase {
  readonly id: string;
  readonly label: string;
  readonly input: import("./json").JsonValue;
  readonly expected: import("./json").JsonValue;
  readonly comparison: PythonComparison;
  readonly tolerance?: number;
}

export interface PythonExecutionSpec {
  readonly runtime: PythonRuntime;
  readonly entrypoint: string;
  readonly invocation: PythonInvocation;
  readonly packages: readonly PythonPackage[];
  readonly outputContract?: string;
  readonly cases: readonly PythonTestCase[];
  readonly limits?: Partial<PythonExecutionLimits>;
}

export interface PythonRunRequest {
  readonly runId: string;
  readonly code: string;
  readonly spec: PythonExecutionSpec;
  readonly caseIds?: readonly string[];
}

export interface PythonCancelRequest {
  readonly runId: string;
}

export type PythonExecutionStatus = "passed" | "failed" | "error" | "timeout";

export interface PythonCaseResult {
  readonly id: string;
  readonly status: PythonExecutionStatus;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly actual?: import("./json").JsonValue;
}

export interface PythonRunResult {
  readonly runId: string;
  readonly status: PythonExecutionStatus;
  readonly stdout: string;
  readonly stderr: string;
  readonly cases: readonly PythonCaseResult[];
  readonly durationMs: number;
  readonly runtime: PythonRuntime;
}

export {
  DEFAULT_PYTHON_EXECUTION_LIMITS,
  isPythonCaseId,
  isPythonRunId,
  PYTHON_CASE_ID_MAX_BYTES,
  PYTHON_CANCEL_REQUEST_BODY_CEILING_BYTES,
  PYTHON_INVOCATION_PATH_MAX_SEGMENTS,
  PYTHON_INVOCATION_SETUP_MAX_STEPS,
  PYTHON_OUTPUT_CONTRACT_MAX_BYTES,
  PYTHON_EXECUTION_POLICY_CEILINGS,
  PYTHON_ID_PATTERN_SOURCE,
  PYTHON_RUN_ID_MAX_BYTES,
  PYTHON_RUN_REQUEST_BODY_CEILING_BYTES,
  validatePythonExecutionSpec,
  validatePythonCancelRequest,
  validatePythonRunRequest,
} from "./validation.ts";
export type { ValidationIssue, ValidationResult } from "./validation.ts";
