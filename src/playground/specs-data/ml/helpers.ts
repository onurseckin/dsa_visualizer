import type {
  PythonExecutionSpec,
  PythonInvocation,
  PythonPackage,
  PythonResultSelection,
  PythonTestCase,
  ValueBinding,
} from "@dsa-visualizer/execution-contracts";
import type { MlCaseFixture, MlExecutionAuditSeed, MlExecutionEntry } from "./types";

export const input = (...path: readonly (number | string)[]): ValueBinding => ({
  from: "input",
  path,
});

export const namespaceInput = (...path: readonly (number | string)[]): ValueBinding => ({
  from: "input",
  path,
  convert: "namespace",
});

export const result = (
  from: PythonResultSelection["from"],
  path: readonly (number | string)[] = [],
  project?: PythonResultSelection["project"],
): PythonResultSelection => ({
  from,
  path,
  ...(project === undefined ? {} : { project }),
});

export const cases = (
  basic: MlCaseFixture,
  boundary: MlCaseFixture,
  complex: MlCaseFixture,
): readonly PythonTestCase[] =>
  (
    [
      ["basic", basic],
      ["boundary", boundary],
      ["complex", complex],
    ] as const
  ).map(([id, fixture]) => ({
    id,
    label: fixture.label,
    input: fixture.input,
    expected: fixture.expected,
    comparison: fixture.comparison ?? "deep-equal",
    ...(fixture.tolerance === undefined ? {} : { tolerance: fixture.tolerance }),
  }));

export const extraCases = (...fixtures: readonly MlCaseFixture[]): readonly PythonTestCase[] =>
  fixtures.map((fixture, index) => ({
    id: `extra-${index}`,
    label: fixture.label,
    input: fixture.input,
    expected: fixture.expected,
    comparison: fixture.comparison ?? "deep-equal",
    ...(fixture.tolerance === undefined ? {} : { tolerance: fixture.tolerance }),
  }));

export const defineMlExecution = (definition: {
  readonly id: string;
  readonly entrypoint: string;
  readonly invocation: PythonInvocation;
  readonly cases: readonly PythonTestCase[];
  readonly starterCode?: string;
  readonly packages?: readonly PythonPackage[];
  readonly audit: MlExecutionAuditSeed;
}): MlExecutionEntry => {
  const packages = definition.packages ?? ["numpy"];

  const spec: PythonExecutionSpec = {
    runtime: "browser",
    entrypoint: definition.entrypoint,
    invocation: definition.invocation,
    packages,
    outputContract: definition.audit.returnBehavior,
    cases: definition.cases,
  };

  const defaultStarterCode =
    definition.starterCode ??
    `# ${definition.id}\nimport numpy as np\n\ndef ${definition.entrypoint}(*args, **kwargs):\n    pass\n`;

  return {
    id: definition.id,
    starterCode: defaultStarterCode,
    audit: {
      ...definition.audit,
      symbol: definition.entrypoint,
      invocation: definition.invocation.kind,
      packages,
    },
    spec,
  };
};
