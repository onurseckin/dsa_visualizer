import type {
  PythonExecutionSpec,
  PythonInvocation,
  PythonResultSelection,
  PythonTestCase,
  ValueBinding,
} from "@dsa-visualizer/execution-contracts";
import { ALGORITHM_REGISTRY } from "../../../algorithms/registry";
import { createDsaStarterCode } from "./starterCode";
import type { DsaCaseFixture, DsaExecutionAuditSeed, DsaExecutionEntry } from "./types";

export const input = (...path: readonly (number | string)[]): ValueBinding => ({
  from: "input",
  path,
});

export const namespaceInput = (...path: readonly (number | string)[]): ValueBinding => ({
  from: "input",
  path,
  convert: "namespace",
});

export const instance = (...path: readonly (number | string)[]): ValueBinding => ({
  from: "instance",
  path,
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
  basic: DsaCaseFixture,
  boundary: DsaCaseFixture,
  complex: DsaCaseFixture,
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

export const defineDsaExecution = (definition: {
  readonly id: string;
  readonly entrypoint: string;
  readonly invocation: PythonInvocation;
  readonly cases: readonly PythonTestCase[];
  readonly audit: DsaExecutionAuditSeed;
}): DsaExecutionEntry => {
  const algorithm = ALGORITHM_REGISTRY[definition.id];
  if (!algorithm) {
    throw new Error(`DSA execution spec references unknown algorithm: ${definition.id}`);
  }

  const spec: PythonExecutionSpec = {
    runtime: "browser",
    entrypoint: definition.entrypoint,
    invocation: definition.invocation,
    packages: [],
    cases: definition.cases,
  };

  return {
    id: definition.id,
    starterCode: createDsaStarterCode(algorithm.code, definition.entrypoint, definition.invocation),
    audit: {
      ...definition.audit,
      symbol: definition.entrypoint,
      invocation: definition.invocation.kind,
      packages: spec.packages,
    },
    spec,
  };
};
