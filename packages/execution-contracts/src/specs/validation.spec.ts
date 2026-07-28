import { describe, expect, it } from "vitest";

import {
  DEFAULT_PYTHON_EXECUTION_LIMITS,
  isJsonValue,
  validatePythonExecutionSpec,
  validatePythonRunRequest,
} from "../index";

const limits = {
  ...DEFAULT_PYTHON_EXECUTION_LIMITS,
  maxSourceBytes: 1_000,
  maxInputBytes: 1_000,
  maxCases: 3,
};

const functionRequest = {
  runId: "run-1",
  code: "def add(a, b): return a + b",
  spec: {
    runtime: "browser",
    entrypoint: "add",
    invocation: {
      kind: "function",
      arguments: [
        { from: "input", path: ["a"] },
        { from: "input", path: ["b"] },
      ],
    },
    packages: ["numpy"],
    cases: [
      {
        id: "adds",
        label: "adds two values",
        input: { a: 2, b: 3 },
        expected: 5,
        comparison: "deep-equal",
      },
    ],
    limits,
  },
};

describe("execution contract validation", () => {
  it("accepts a valid function invocation request", () => {
    expect(validatePythonRunRequest(functionRequest)).toMatchObject({
      ok: true,
      value: functionRequest,
    });
  });

  it("accepts a valid class-method invocation request", () => {
    const request = {
      ...functionRequest,
      spec: {
        ...functionRequest.spec,
        entrypoint: "Accumulator",
        invocation: {
          kind: "class-method",
          constructor: [{ from: "input", path: ["initial"] }],
          method: "add",
          arguments: [{ from: "input", path: ["value"] }],
        },
      },
    };

    expect(validatePythonRunRequest(request).ok).toBe(true);
  });

  it("accepts a valid stdin invocation request", () => {
    const request = {
      ...functionRequest,
      spec: {
        ...functionRequest.spec,
        entrypoint: "main",
        invocation: { kind: "stdin", output: "text" },
      },
    };

    expect(validatePythonRunRequest(request).ok).toBe(true);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    undefined,
    () => undefined,
    { nested: undefined },
  ])("rejects non-JSON values", (value) => {
    expect(isJsonValue(value)).toBe(false);
  });

  it("rejects cyclic JSON candidates without throwing", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    expect(() => isJsonValue(cyclic)).not.toThrow();
    expect(isJsonValue(cyclic)).toBe(false);
  });

  it("returns issues for malformed request shapes", () => {
    const result = validatePythonRunRequest({
      runId: "",
      code: 4,
      spec: { runtime: "native" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.length).toBeGreaterThan(0);
  });

  it("rejects duplicate case identifiers", () => {
    const spec = {
      ...functionRequest.spec,
      cases: [...functionRequest.spec.cases, { ...functionRequest.spec.cases[0] }],
    };

    expect(validatePythonExecutionSpec(spec).ok).toBe(false);
  });

  it("rejects torch in the browser runtime", () => {
    const spec = { ...functionRequest.spec, packages: ["torch"] };

    expect(validatePythonExecutionSpec(spec).ok).toBe(false);
  });

  it("requires tolerance only for float comparisons", () => {
    const missingTolerance = {
      ...functionRequest.spec,
      cases: [{ ...functionRequest.spec.cases[0], comparison: "float" }],
    };
    const extraTolerance = {
      ...functionRequest.spec,
      cases: [{ ...functionRequest.spec.cases[0], tolerance: 0.1 }],
    };
    const invalidTolerance = {
      ...functionRequest.spec,
      cases: [{ ...functionRequest.spec.cases[0], comparison: "float", tolerance: -0.1 }],
    };

    expect(validatePythonExecutionSpec(missingTolerance).ok).toBe(false);
    expect(validatePythonExecutionSpec(extraTolerance).ok).toBe(false);
    expect(validatePythonExecutionSpec(invalidTolerance).ok).toBe(false);
  });

  it("rejects a case selection that does not exist", () => {
    expect(validatePythonRunRequest({ ...functionRequest, caseIds: ["missing"] }).ok).toBe(false);
  });

  it("rejects source, input, and count cap violations", () => {
    const tooMuchSource = { ...functionRequest, code: "x".repeat(1_001) };
    const tooMuchInput = {
      ...functionRequest,
      spec: {
        ...functionRequest.spec,
        cases: [{ ...functionRequest.spec.cases[0], input: "x".repeat(1_001) }],
      },
    };
    const tooManyCases = {
      ...functionRequest,
      spec: {
        ...functionRequest.spec,
        cases: Array.from({ length: 4 }, (_, index) => ({
          ...functionRequest.spec.cases[0],
          id: `case-${index}`,
        })),
      },
    };

    expect(validatePythonRunRequest(tooMuchSource).ok).toBe(false);
    expect(validatePythonRunRequest(tooMuchInput).ok).toBe(false);
    expect(validatePythonRunRequest(tooManyCases).ok).toBe(false);
  });

  it("rejects non-finite execution limits and invalid identifiers", () => {
    const infiniteLimit = {
      ...functionRequest.spec,
      limits: { ...limits, wallTimeMs: Number.POSITIVE_INFINITY },
    };
    const invalidEntrypoint = { ...functionRequest.spec, entrypoint: "not-valid" };

    expect(validatePythonExecutionSpec(infiniteLimit).ok).toBe(false);
    expect(validatePythonExecutionSpec(invalidEntrypoint).ok).toBe(false);
  });
});
