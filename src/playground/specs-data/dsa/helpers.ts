import type {
  PythonExecutionSpec,
  PythonInvocation,
  PythonResultSelection,
  PythonTestCase,
  ValueBinding,
} from "@dsa-visualizer/execution-contracts";
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
  const spec: PythonExecutionSpec = {
    runtime: "browser",
    entrypoint: definition.entrypoint,
    invocation: definition.invocation,
    packages: [],
    cases: definition.cases,
  };

  return {
    id: definition.id,
    starterCode: starterCodeFor(definition.entrypoint, definition.invocation),
    audit: {
      ...definition.audit,
      symbol: definition.entrypoint,
      invocation: definition.invocation.kind,
      packages: spec.packages,
    },
    spec,
  };
};

const starterCodeFor = (entrypoint: string, invocation: PythonInvocation): string => {
  if (invocation.kind === "stdin") {
    return [
      "# Read the authored input from standard input.",
      'raise NotImplementedError("Implement the stdin solution")',
    ].join("\n");
  }
  if (invocation.kind === "function") {
    return [
      `def ${entrypoint}(${parameters(invocation.arguments.length)}):`,
      '    raise NotImplementedError("Implement this function")',
    ].join("\n");
  }

  const methods = new Map<string, number>();
  for (const setup of invocation.setup ?? []) methods.set(setup.method, setup.arguments.length);
  methods.set(invocation.method, invocation.arguments.length);
  const lines = [
    `class ${entrypoint}:`,
    `    def __init__(self${prefixedParameters(invocation.constructor.length)}):`,
    "        pass",
  ];
  for (const [method, count] of methods) {
    lines.push(
      "",
      `    def ${method}(self${prefixedParameters(count)}):`,
      '        raise NotImplementedError("Implement this method")',
    );
  }
  return lines.join("\n");
};

const parameters = (count: number): string =>
  Array.from({ length: count }, (_, index) => `arg${index + 1}`).join(", ");

const prefixedParameters = (count: number): string => {
  const value = parameters(count);
  return value.length === 0 ? "" : `, ${value}`;
};
