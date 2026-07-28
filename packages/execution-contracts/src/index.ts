export type { JsonObject, JsonPrimitive, JsonValue } from "./json";
export { isJsonValue } from "./json";

export type PythonRuntime = "browser" | "server";

export type PythonPackage = "numpy" | "torch";

export interface ValueBinding {
  readonly from: "input";
  readonly path: readonly (number | string)[];
}

export type PythonInvocation =
  | {
      readonly kind: "function";
      readonly arguments: readonly ValueBinding[];
    }
  | {
      readonly kind: "class-method";
      readonly constructor: readonly ValueBinding[];
      readonly method: string;
      readonly arguments: readonly ValueBinding[];
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

export type PythonComparison = "deep-equal" | "unordered" | "float" | "stdout";

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
  readonly cases: readonly PythonTestCase[];
  readonly limits?: Partial<PythonExecutionLimits>;
}

export interface PythonRunRequest {
  readonly runId: string;
  readonly code: string;
  readonly spec: PythonExecutionSpec;
  readonly caseIds?: readonly string[];
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
  PYTHON_EXECUTION_POLICY_CEILINGS,
  validatePythonExecutionSpec,
  validatePythonRunRequest,
} from "./validation";
export type { ValidationIssue, ValidationResult } from "./validation";
