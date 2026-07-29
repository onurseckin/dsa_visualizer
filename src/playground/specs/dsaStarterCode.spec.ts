import { describe, expect, it } from "vitest";
import type { PythonInvocation, ValueBinding } from "@dsa-visualizer/execution-contracts";
import { createDsaStarterCode } from "../specs-data/dsa/starterCode";

const binding: ValueBinding = { from: "input", path: [] };

describe("createDsaStarterCode", () => {
  it("keeps canonical function annotations and defaults", () => {
    const invocation: PythonInvocation = {
      kind: "function",
      arguments: [binding, binding],
    };

    expect(
      createDsaStarterCode(
        [
          "def solve(",
          "    values: list[tuple[int, int]],",
          "    limit: int = max(1, 2),",
          "):",
          "    return values[:limit]",
        ].join("\n"),
        "solve",
        invocation,
      ),
    ).toBe(
      [
        "def solve(",
        "    values: list[tuple[int, int]],",
        "    limit: int = max(1, 2),",
        "):",
        '    raise NotImplementedError("Implement this function")',
      ].join("\n"),
    );
  });

  it("preserves positional-only, variadic, keyword-only, and variadic-keyword kinds", () => {
    const invocation: PythonInvocation = {
      kind: "function",
      arguments: [binding, binding, binding, binding, binding],
    };

    expect(
      createDsaStarterCode(
        [
          "def solve(",
          "    primary: int, /, optional: str = 'x',",
          "    *values: float, flag: bool = True, **metadata: object",
          "):",
          "    return primary",
        ].join("\n"),
        "solve",
        invocation,
      ),
    ).toBe(
      [
        "def solve(",
        "    primary: int, /, optional: str = 'x',",
        "    *values: float, flag: bool = True, **metadata: object",
        "):",
        '    raise NotImplementedError("Implement this function")',
      ].join("\n"),
    );
  });

  it("isolates the requested class and emits each invoked method once", () => {
    const invocation: PythonInvocation = {
      kind: "class-method",
      constructor: [binding, binding],
      setup: [
        { method: "update", arguments: [binding, binding, binding] },
        { method: "update", arguments: [binding, binding, binding] },
      ],
      method: "query",
      arguments: [binding, binding, binding],
      result: { from: "return", path: [] },
    };

    const starter = createDsaStarterCode(
      [
        "class Node:",
        "    def __init__(self, value):",
        "        self.value = value",
        "",
        "class RangeIndex:",
        "    def __init__(self, left, right):",
        "        pass",
        "",
        "    def update(self, node, index, value):",
        "        pass",
        "",
        "    def query(self, node, left, right):",
        "        pass",
        "",
        "def after_class():",
        "    pass",
      ].join("\n"),
      "RangeIndex",
      invocation,
    );

    expect(starter).toContain("def __init__(self, left, right):");
    expect(starter).toContain("def update(self, node, index, value):");
    expect(starter).toContain("def query(self, node, left, right):");
    expect(starter.match(/def update/g)).toHaveLength(1);
  });

  it("preserves the stdin starter contract", () => {
    expect(
      createDsaStarterCode("", "solve", {
        kind: "stdin",
        output: "text",
      }),
    ).toContain('raise NotImplementedError("Implement the stdin solution")');
  });

  it("rejects canonical placeholders, arity drift, and invalid class receivers", () => {
    expect(() =>
      createDsaStarterCode("def solve(arg1):\n    pass", "solve", {
        kind: "function",
        arguments: [binding],
      }),
    ).toThrow("forbidden generic parameter arg1");

    expect(() =>
      createDsaStarterCode("def solve(value):\n    pass", "solve", {
        kind: "function",
        arguments: [binding, binding],
      }),
    ).toThrow("canonical arity 1 does not match execution arity 2");

    expect(() =>
      createDsaStarterCode(
        "class Solver:\n    def __init__(cls):\n        pass\n    def run(self):\n        pass",
        "Solver",
        {
          kind: "class-method",
          constructor: [],
          method: "run",
          arguments: [],
          result: { from: "return", path: [] },
        },
      ),
    ).toThrow("must declare self as its first canonical parameter");
  });
});
