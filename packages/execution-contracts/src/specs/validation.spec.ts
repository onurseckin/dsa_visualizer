import { describe, expect, it } from "vitest";

import * as executionContracts from "../index";
import {
  DEFAULT_PYTHON_EXECUTION_LIMITS,
  isJsonValue,
  PYTHON_EXECUTION_POLICY_CEILINGS,
  PYTHON_RUN_REQUEST_BODY_CEILING_BYTES,
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
        cases: [{ ...functionRequest.spec.cases[0], input: "2 3" }],
      },
    };

    expect(validatePythonRunRequest(request).ok).toBe(true);
  });

  it("keeps partial limits below immutable server policy ceilings", () => {
    for (const [name, ceiling] of Object.entries(PYTHON_EXECUTION_POLICY_CEILINGS)) {
      const spec = {
        ...functionRequest.spec,
        limits: { [name]: ceiling + 1 },
      };

      expect(validatePythonExecutionSpec(spec).ok).toBe(false);
    }
  });

  it("accepts authorable limit overrides at or below server policy ceilings", () => {
    const spec = {
      ...functionRequest.spec,
      limits: { wallTimeMs: PYTHON_EXECUTION_POLICY_CEILINGS.wallTimeMs },
    };

    expect(validatePythonExecutionSpec(spec).ok).toBe(true);
  });

  it("accepts a one-field execution limit override", () => {
    const spec = {
      ...functionRequest.spec,
      limits: { wallTimeMs: 500 },
    };

    expect(validatePythonExecutionSpec(spec).ok).toBe(true);
  });

  it("rejects unknown and malformed limit overrides", () => {
    const unknownLimit = {
      ...functionRequest.spec,
      limits: { madeUpLimit: 1 },
    };
    const malformedLimit = {
      ...functionRequest.spec,
      limits: { maxCases: Number.NaN },
    };

    expect(validatePythonExecutionSpec(unknownLimit).ok).toBe(false);
    expect(validatePythonExecutionSpec(malformedLimit).ok).toBe(false);
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

  it("exports stable run and case identifier limits", () => {
    expect(executionContracts.PYTHON_RUN_ID_MAX_BYTES).toBe(128);
    expect(executionContracts.PYTHON_CASE_ID_MAX_BYTES).toBe(96);
    expect(executionContracts.PYTHON_ID_PATTERN_SOURCE).toBe("[A-Za-z0-9._:-]+");
  });

  it("accepts canonical identifiers at their maximum lengths", () => {
    const request = {
      ...functionRequest,
      runId: "r".repeat(128),
      spec: {
        ...functionRequest.spec,
        cases: [{ ...functionRequest.spec.cases[0], id: "c".repeat(96) }],
      },
    };

    expect(validatePythonRunRequest(request).ok).toBe(true);
  });

  it("exports and validates the bounded Python cancellation envelope", () => {
    const contracts = executionContracts as unknown as {
      PYTHON_CANCEL_REQUEST_BODY_CEILING_BYTES?: number;
      validatePythonCancelRequest?: (input: unknown) => { readonly ok: boolean };
    };

    expect(contracts.PYTHON_CANCEL_REQUEST_BODY_CEILING_BYTES).toBe(256);
    expect(contracts.validatePythonCancelRequest?.({ runId: "run:current_1" })).toMatchObject({
      ok: true,
    });
    expect(contracts.validatePythonCancelRequest?.({ runId: "contains space" })).toMatchObject({
      ok: false,
    });
    expect(contracts.validatePythonCancelRequest?.({ runId: "r".repeat(129) })).toMatchObject({
      ok: false,
    });
  });

  it.each(["contains space", "contains/slash", "snowman-☃", "r".repeat(129)])(
    "rejects a non-canonical run identifier: %s",
    (runId) => {
      expect(validatePythonRunRequest({ ...functionRequest, runId }).ok).toBe(false);
    },
  );

  it.each(["contains space", "contains/slash", "snowman-☃", "c".repeat(97)])(
    "rejects a non-canonical case identifier: %s",
    (id) => {
      const spec = {
        ...functionRequest.spec,
        cases: [{ ...functionRequest.spec.cases[0], id }],
      };
      expect(validatePythonExecutionSpec(spec).ok).toBe(false);
    },
  );

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

  it("enforces comparison-specific expected values and stdin input", () => {
    const stdoutWithNonStringExpected = {
      ...functionRequest.spec,
      cases: [{ ...functionRequest.spec.cases[0], comparison: "stdout", expected: 5 }],
    };
    const floatWithNonNumericExpected = {
      ...functionRequest.spec,
      cases: [
        {
          ...functionRequest.spec.cases[0],
          comparison: "float",
          expected: "5",
          tolerance: 0.01,
        },
      ],
    };
    const stdinWithNonStringInput = {
      ...functionRequest.spec,
      invocation: { kind: "stdin", output: "text" },
    };
    const validFloat = {
      ...functionRequest.spec,
      cases: [
        { ...functionRequest.spec.cases[0], comparison: "float", expected: 5, tolerance: 0.01 },
      ],
    };

    expect(validatePythonExecutionSpec(stdoutWithNonStringExpected).ok).toBe(false);
    expect(validatePythonExecutionSpec(floatWithNonNumericExpected).ok).toBe(false);
    expect(validatePythonExecutionSpec(stdinWithNonStringInput).ok).toBe(false);
    expect(validatePythonExecutionSpec(validFloat).ok).toBe(true);
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

  it("accepts the worst-case escaped policy envelope and caps all valid request bodies", () => {
    const request = {
      ...functionRequest,
      code: "\u0001".repeat(PYTHON_EXECUTION_POLICY_CEILINGS.maxSourceBytes),
      spec: {
        ...functionRequest.spec,
        limits: {
          maxSourceBytes: PYTHON_EXECUTION_POLICY_CEILINGS.maxSourceBytes,
          maxInputBytes: PYTHON_EXECUTION_POLICY_CEILINGS.maxInputBytes,
          maxResultBytes: PYTHON_EXECUTION_POLICY_CEILINGS.maxResultBytes,
        },
        cases: [
          {
            ...functionRequest.spec.cases[0],
            input: "i".repeat(PYTHON_EXECUTION_POLICY_CEILINGS.maxInputBytes - 2),
            expected: "e".repeat(PYTHON_EXECUTION_POLICY_CEILINGS.maxResultBytes - 2),
          },
        ],
      },
    };
    const serializedBytes = new TextEncoder().encode(JSON.stringify(request)).byteLength;

    expect(serializedBytes).toBeGreaterThan(3 * 1024 * 1024);
    expect(serializedBytes).toBeLessThanOrEqual(PYTHON_RUN_REQUEST_BODY_CEILING_BYTES);
    expect(validatePythonRunRequest(request).ok).toBe(true);

    const oversizedMetadata = {
      ...functionRequest,
      runId: "r".repeat(PYTHON_RUN_REQUEST_BODY_CEILING_BYTES),
    };
    expect(validatePythonRunRequest(oversizedMetadata)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "$", message: expect.stringContaining("body ceiling") }),
      ]),
    });
  });

  it("rejects expected payloads that exceed maxResultBytes", () => {
    const spec = {
      ...functionRequest.spec,
      limits: { maxResultBytes: 10 },
      cases: [{ ...functionRequest.spec.cases[0], expected: "x".repeat(20) }],
    };

    expect(validatePythonExecutionSpec(spec).ok).toBe(false);
  });

  it("rejects aggregate expected stdout above an overridden maxOutputBytes", () => {
    const spec = {
      ...functionRequest.spec,
      limits: { maxOutputBytes: 5 },
      cases: [
        {
          ...functionRequest.spec.cases[0],
          id: "stdout-a",
          comparison: "stdout",
          expected: "abc",
        },
        {
          ...functionRequest.spec.cases[0],
          id: "stdout-b",
          comparison: "stdout",
          expected: "def",
        },
      ],
    };

    expect(validatePythonExecutionSpec(spec)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("maxOutputBytes") }),
      ]),
    });
  });

  it("applies expected stdout accounting only to selected cases", () => {
    const request = {
      ...functionRequest,
      caseIds: ["stdout-a"],
      spec: {
        ...functionRequest.spec,
        limits: { maxOutputBytes: 5 },
        cases: [
          {
            ...functionRequest.spec.cases[0],
            id: "stdout-a",
            comparison: "stdout",
            expected: "abc",
          },
          {
            ...functionRequest.spec.cases[0],
            id: "stdout-b",
            comparison: "stdout",
            expected: "def",
          },
        ],
      },
    };

    expect(validatePythonRunRequest(request).ok).toBe(true);
    expect(
      validatePythonRunRequest({ ...request, caseIds: ["stdout-a", "stdout-b"] }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("maxOutputBytes") }),
      ]),
    });
  });

  it("uses the default maxOutputBytes for expected stdout accounting", () => {
    const spec = {
      ...functionRequest.spec,
      cases: [
        {
          ...functionRequest.spec.cases[0],
          comparison: "stdout",
          expected: "x".repeat(DEFAULT_PYTHON_EXECUTION_LIMITS.maxOutputBytes + 1),
        },
      ],
    };

    expect(validatePythonExecutionSpec(spec)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("maxOutputBytes") }),
      ]),
    });
  });

  it("rejects Python source containing a lone surrogate", () => {
    expect(validatePythonRunRequest({ ...functionRequest, code: "\ud800" })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: "$.code",
          message: expect.stringContaining("UTF-8"),
        }),
      ]),
    });
  });

  it("rejects lone surrogates nested in JSON case values", () => {
    const request = {
      ...functionRequest,
      spec: {
        ...functionRequest.spec,
        cases: [{ ...functionRequest.spec.cases[0], input: { nested: "\udfff" } }],
      },
    };

    expect(validatePythonRunRequest(request)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: "$.spec.cases[0].input.nested",
          message: expect.stringContaining("UTF-8"),
        }),
      ]),
    });
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
