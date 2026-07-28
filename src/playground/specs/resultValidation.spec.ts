import { describe, expect, it } from "vitest";
import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";

import { validatePythonRunResult } from "../types";

const SPEC: PythonExecutionSpec = {
  runtime: "browser",
  entrypoint: "solve",
  invocation: {
    kind: "function",
    arguments: [{ from: "input", path: [] }],
  },
  packages: [],
  limits: {
    maxOutputBytes: 32,
    maxResultBytes: 32,
    maxCases: 2,
  },
  cases: [
    {
      id: "one",
      label: "One",
      input: 1,
      expected: 2,
      comparison: "deep-equal",
    },
    {
      id: "two",
      label: "Two",
      input: 2,
      expected: 4,
      comparison: "deep-equal",
    },
  ],
};

const REQUEST: PythonRunRequest = {
  runId: "run-result",
  code: "def solve(value):\n    return value * 2",
  spec: SPEC,
  caseIds: ["one"],
};

const RESULT: PythonRunResult = {
  runId: REQUEST.runId,
  status: "passed",
  stdout: "a",
  stderr: "",
  cases: [
    {
      id: "one",
      status: "passed",
      stdout: "a",
      stderr: "",
      durationMs: 1,
      actual: 2,
    },
  ],
  durationMs: 2,
  runtime: "browser",
};

describe("bounded Python result validation", () => {
  it("accepts a complete normalized result for an authored case", () => {
    expect(validatePythonRunResult(REQUEST, RESULT, "browser")).toEqual({
      ok: true,
      value: RESULT,
    });
  });

  it.each([
    ["wrong run", { ...RESULT, runId: "other" }],
    ["wrong runtime", { ...RESULT, runtime: "server" }],
    ["unknown status", { ...RESULT, status: "complete" }],
    ["missing stdout", { ...RESULT, stdout: undefined }],
    ["negative duration", { ...RESULT, durationMs: -1 }],
    [
      "unknown case",
      {
        ...RESULT,
        cases: [{ ...RESULT.cases[0], id: "hidden" }],
      },
    ],
    [
      "duplicate case",
      {
        ...RESULT,
        stdout: "aa",
        cases: [RESULT.cases[0], RESULT.cases[0]],
      },
    ],
    [
      "invalid case status",
      {
        ...RESULT,
        cases: [{ ...RESULT.cases[0], status: "complete" }],
      },
    ],
    [
      "missing actual for a completed case",
      {
        ...RESULT,
        cases: [
          {
            id: "one",
            status: "passed",
            stdout: "a",
            stderr: "",
            durationMs: 1,
          },
        ],
      },
    ],
    [
      "non-JSON actual",
      {
        ...RESULT,
        cases: [{ ...RESULT.cases[0], actual: Number.NaN }],
      },
    ],
    ["unknown root property", { ...RESULT, debug: "leak" }],
    [
      "unknown case property",
      {
        ...RESULT,
        cases: [{ ...RESULT.cases[0], traceback: "leak" }],
      },
    ],
    ["non-aggregate stdout", { ...RESULT, stdout: "different" }],
    ["inconsistent overall status", { ...RESULT, status: "failed" }],
  ])("rejects %s", (_label, value) => {
    expect(validatePythonRunResult(REQUEST, value, "browser").ok).toBe(false);
  });

  it("rejects aggregate output above the authored envelope", () => {
    const output = "x".repeat(33);
    const outputOverflow = {
      ...RESULT,
      stdout: output,
      cases: [{ ...RESULT.cases[0], stdout: output }],
    };

    expect(validatePythonRunResult(REQUEST, outputOverflow, "browser").ok).toBe(false);
  });

  it("rejects aggregate actual-result payloads above the authored envelope", () => {
    const twoCasesRequest = { ...REQUEST, caseIds: ["one", "two"] };
    const resultOverflow = {
      ...RESULT,
      stdout: "ab",
      cases: [
        { ...RESULT.cases[0], stdout: "a", actual: "x".repeat(15) },
        {
          ...RESULT.cases[0],
          id: "two",
          stdout: "b",
          actual: "x".repeat(15),
        },
      ],
    };

    expect(validatePythonRunResult(twoCasesRequest, resultOverflow, "browser").ok).toBe(false);
  });

  it.each([
    ["null", null],
    ["true", true],
    ["false", false],
    ["negative zero", -0],
    ["a bounded array", [null, true]],
    ["a bounded object", { first: 1, second: "ok" }],
    ["a shared non-cyclic object", [{ value: 1 }, { value: 1 }]],
    ["escaped text", "\b\t\n"],
    ["multi-byte text", "é€😀"],
  ])("accepts %s as a bounded JSON actual value", (_label, actual) => {
    const candidate = {
      ...RESULT,
      cases: [{ ...RESULT.cases[0], actual }],
    };

    expect(validatePythonRunResult(REQUEST, candidate, "browser").ok).toBe(true);
  });

  it.each([
    ["a sparse array", Array(1)],
    ["a non-plain object", new Date(0)],
    ["an unsupported primitive", Symbol("not-json")],
    ["an invalid high surrogate", "\ud800"],
    ["an invalid low surrogate", "\udfff"],
    ["an oversized array", Array.from({ length: 20 }, () => null)],
    [
      "an oversized object",
      {
        first: "1234567890",
        second: "1234567890",
      },
    ],
    ["an invalid object key", { ["\ud800"]: true }],
  ])("rejects %s as an actual value", (_label, actual) => {
    const candidate = {
      ...RESULT,
      cases: [{ ...RESULT.cases[0], actual }],
    };

    expect(validatePythonRunResult(REQUEST, candidate, "browser").ok).toBe(false);
  });

  it("accounts for JSON control-character escaping without serializing the actual value", () => {
    const escapedResult = {
      ...RESULT,
      cases: [{ ...RESULT.cases[0], actual: "\v".repeat(6) }],
    };

    expect(validatePythonRunResult(REQUEST, escapedResult, "browser").ok).toBe(false);
  });

  it("rejects cyclic or accessor-backed actual values without serializing them", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const accessor = Object.defineProperty({}, "value", {
      enumerable: true,
      get() {
        throw new Error("must be contained by validation");
      },
    });

    expect(
      validatePythonRunResult(
        REQUEST,
        { ...RESULT, cases: [{ ...RESULT.cases[0], actual: cyclic }] },
        "browser",
      ).ok,
    ).toBe(false);
    expect(
      validatePythonRunResult(
        REQUEST,
        { ...RESULT, cases: [{ ...RESULT.cases[0], actual: accessor }] },
        "browser",
      ).ok,
    ).toBe(false);
  });

  it("validates UTF-8 and the combined stdout and stderr budget", () => {
    const unicodeOutput = "é€😀";
    const valid = {
      ...RESULT,
      stdout: unicodeOutput,
      cases: [{ ...RESULT.cases[0], stdout: unicodeOutput }],
    };
    const invalidCaseStream = {
      ...RESULT,
      stdout: "",
      stderr: "\ud800",
      cases: [{ ...RESULT.cases[0], stdout: "", stderr: "\ud800" }],
    };
    const invalidLowSurrogateStream = {
      ...RESULT,
      stdout: "",
      stderr: "\udfff",
      cases: [{ ...RESULT.cases[0], stdout: "", stderr: "\udfff" }],
    };
    const oversizedCaseStderr = {
      ...RESULT,
      stdout: "a",
      stderr: "x".repeat(32),
      cases: [{ ...RESULT.cases[0], stdout: "a", stderr: "x".repeat(32) }],
    };
    const oversizedRunError = {
      ...RESULT,
      status: "error",
      stdout: "",
      stderr: "x".repeat(33),
      cases: [],
    };

    expect(validatePythonRunResult(REQUEST, valid, "browser").ok).toBe(true);
    expect(validatePythonRunResult(REQUEST, invalidCaseStream, "browser").ok).toBe(false);
    expect(validatePythonRunResult(REQUEST, invalidLowSurrogateStream, "browser").ok).toBe(false);
    expect(validatePythonRunResult(REQUEST, oversizedCaseStderr, "browser").ok).toBe(false);
    expect(validatePythonRunResult(REQUEST, oversizedRunError, "browser").ok).toBe(false);
  });

  it("contains property access failures while validating the result envelope", () => {
    const unreadable = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("must not escape");
        },
      },
    );

    expect(validatePythonRunResult(REQUEST, unreadable, "browser")).toMatchObject({
      ok: false,
      issues: [{ path: "$" }],
    });
  });

  it("honors selected case IDs and normalized timeout envelopes", () => {
    const selected = { ...REQUEST, caseIds: ["two"] };
    const selectedResult = {
      ...RESULT,
      stdout: "",
      cases: [{ ...RESULT.cases[0], id: "two", stdout: "", actual: 4 }],
    };
    const timeout: PythonRunResult = {
      runId: REQUEST.runId,
      status: "timeout",
      stdout: "",
      stderr: "bounded timeout",
      cases: [],
      durationMs: 10,
      runtime: "browser",
    };

    expect(validatePythonRunResult(selected, selectedResult, "browser").ok).toBe(true);
    expect(validatePythonRunResult(selected, RESULT, "browser").ok).toBe(false);
    expect(validatePythonRunResult(REQUEST, timeout, "browser").ok).toBe(true);
  });

  it("requires all selected cases for case-level results", () => {
    const allCasesRequest = { ...REQUEST, caseIds: ["one", "two"] };

    expect(validatePythonRunResult(allCasesRequest, RESULT, "browser").ok).toBe(false);
  });

  it("rejects a completed run without any case results", () => {
    expect(
      validatePythonRunResult(
        REQUEST,
        { ...RESULT, stdout: "", status: "passed", cases: [] },
        "browser",
      ).ok,
    ).toBe(false);
  });

  it("accepts a complete multi-case aggregate regardless of selection order", () => {
    const twoCasesRequest = { ...REQUEST, caseIds: ["two", "one"] };
    const twoCasesResult = {
      ...RESULT,
      stdout: "ab",
      cases: [
        { ...RESULT.cases[0], stdout: "a" },
        { ...RESULT.cases[0], id: "two", stdout: "b", actual: 4 },
      ],
    };

    expect(validatePythonRunResult(twoCasesRequest, twoCasesResult, "browser").ok).toBe(true);
  });

  it("accepts consistent failed, error, and timed-out case status envelopes", () => {
    for (const status of ["failed", "error", "timeout"] as const) {
      const caseResult =
        status === "failed"
          ? { ...RESULT.cases[0], status }
          : {
              id: "one",
              status,
              stdout: "a",
              stderr: "",
              durationMs: 1,
            };
      const candidate = {
        ...RESULT,
        status,
        cases: [caseResult],
      };

      expect(validatePythonRunResult(REQUEST, candidate, "browser").ok).toBe(true);
    }
  });
});
