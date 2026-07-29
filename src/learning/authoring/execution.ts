import {
  validatePythonExecutionSpec,
  type PythonExecutionSpec,
  type PythonInvocation,
  type PythonPackage,
  type PythonRuntime,
  type PythonTestCase,
} from "@dsa-visualizer/execution-contracts";
import { deepFreezeCopy } from "./freeze";

export interface FunctionExecutionInput {
  readonly entrypoint: string;
  readonly outputContract: string;
  readonly cases: readonly PythonTestCase[];
  readonly runtime?: PythonRuntime;
  readonly packages?: readonly PythonPackage[];
  readonly arguments?: Extract<PythonInvocation, { kind: "function" }>["arguments"];
  readonly result?: Extract<PythonInvocation, { kind: "function" }>["result"];
  readonly limits?: PythonExecutionSpec["limits"];
}

export function functionExecution(input: FunctionExecutionInput): PythonExecutionSpec {
  if (input.cases.length < 3) {
    throw new Error("Executable learning items require at least three authored cases.");
  }
  const caseIds = new Set(input.cases.map((testCase) => testCase.id));
  const caseBehaviors = new Set(
    input.cases.map((testCase) =>
      JSON.stringify([
        testCase.input,
        testCase.expected,
        testCase.comparison,
        testCase.tolerance ?? null,
      ]),
    ),
  );
  if (caseIds.size !== input.cases.length || caseBehaviors.size !== input.cases.length) {
    throw new Error("Executable learning items require distinct authored cases.");
  }
  if (!input.outputContract.trim()) {
    throw new Error("Executable learning items require a public output contract.");
  }

  const spec = deepFreezeCopy<PythonExecutionSpec>({
    runtime: input.runtime ?? "browser",
    entrypoint: input.entrypoint,
    invocation: {
      kind: "function",
      arguments: input.arguments ?? [{ from: "input", path: [] }],
      ...(input.result ? { result: input.result } : {}),
    },
    packages: input.packages ?? [],
    outputContract: input.outputContract,
    cases: input.cases,
    ...(input.limits ? { limits: input.limits } : {}),
  });
  const validation = validatePythonExecutionSpec(spec);
  if (!validation.ok) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`Invalid Python execution contract: ${details}`);
  }
  return spec;
}
