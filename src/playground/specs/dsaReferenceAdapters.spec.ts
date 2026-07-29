import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import type { PythonExecutionSpec, PythonRunResult } from "@dsa-visualizer/execution-contracts";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";
import { DSA_EXECUTION_SPECS } from "../specs-data/dsa";

const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");

function executeReference(id: string, spec: PythonExecutionSpec): PythonRunResult {
  const algorithm = ALGORITHM_REGISTRY[id];
  if (!algorithm) throw new Error(`Missing algorithm ${id}`);

  const completed = spawnSync("python3", ["-I", harnessPath], {
    input: JSON.stringify({
      runId: `reference-${id}`,
      code: algorithm.code,
      spec,
    }),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  });
  if (completed.error) throw completed.error;
  if (completed.status !== 0) throw new Error(completed.stderr);
  return JSON.parse(completed.stdout) as PythonRunResult;
}

const functionSpec = (
  entrypoint: string,
  argumentPaths: readonly (readonly (number | string)[])[],
  cases: PythonExecutionSpec["cases"],
): PythonExecutionSpec => ({
  runtime: "browser",
  entrypoint,
  invocation: {
    kind: "function",
    arguments: argumentPaths.map((path) => ({ from: "input", path })),
  },
  packages: [],
  cases,
});

describe("DSA canonical Python execution adapters", () => {
  test("derives deterministic prefix codes from the canonical Huffman tree", () => {
    const result = executeReference(
      "huffman-coding",
      functionSpec(
        "huffman_codes",
        [["text"]],
        [
          {
            id: "basic",
            label: "Four unique frequencies",
            input: { text: "aaaaaaaabbbbccd" },
            expected: { a: "1", b: "01", c: "001", d: "000" },
            comparison: "deep-equal",
          },
          {
            id: "boundary",
            label: "Single symbol",
            input: { text: "z" },
            expected: { z: "0" },
            comparison: "deep-equal",
          },
          {
            id: "complex",
            label: "Five unique frequencies",
            input: { text: "aaaaaaaaaaaaaaaabbbbbbbbccccdde" },
            expected: { a: "1", b: "01", c: "001", d: "0001", e: "0000" },
            comparison: "deep-equal",
          },
        ],
      ),
    );

    expect(result.status).toBe("passed");
    expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
  });

  test("queries old and path-copied persistent segment-tree versions", () => {
    const result = executeReference(
      "persistent-segment-tree",
      functionSpec(
        "persistent_segment_tree_operations",
        [["arr"], ["index"], ["value"], ["left"], ["right"]],
        [
          {
            id: "basic",
            label: "Middle point update",
            input: { arr: [1, 2, 3, 4], index: 1, value: 10, left: 0, right: 2 },
            expected: { before: 6, after: 14, originalTotal: 10, updatedTotal: 18 },
            comparison: "deep-equal",
          },
          {
            id: "boundary",
            label: "Single value version",
            input: { arr: [5], index: 0, value: -2, left: 0, right: 0 },
            expected: { before: 5, after: -2, originalTotal: 5, updatedTotal: -2 },
            comparison: "deep-equal",
          },
          {
            id: "complex",
            label: "Negative replacement in a partial range",
            input: { arr: [2, -1, 5, 3, 7], index: 2, value: -4, left: 1, right: 4 },
            expected: { before: 14, after: 5, originalTotal: 16, updatedTotal: 7 },
            comparison: "deep-equal",
          },
        ],
      ),
    );

    expect(result.status).toBe("passed");
    expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
  });

  test("defines reverse-linked-list without unresolved runtime annotations", () => {
    expect(ALGORITHM_REGISTRY["reverse-linked-list"]?.code).toContain(
      'def reverse_linked_list(head: "Optional[ListNode]") -> "Optional[ListNode]":',
    );

    const result = executeReference(
      "reverse-linked-list",
      functionSpec(
        "reverse_linked_list",
        [["head"]],
        [
          {
            id: "empty",
            label: "Empty linked list",
            input: { head: null },
            expected: null,
            comparison: "deep-equal",
          },
        ],
      ),
    );

    expect(result.status).toBe("passed");
    expect(result.cases[0]).toMatchObject({ status: "passed", actual: null });
  });

  test.each(["bfs-graph", "kosaraju-scc", "ford-fulkerson", "two-sat-solver"])(
    "executes the corrected canonical %s reference",
    (id) => {
      const spec = DSA_EXECUTION_SPECS.get(id);
      if (!spec) throw new Error(`Missing execution spec ${id}`);

      const result = executeReference(id, spec);

      expect(result.status).toBe("passed");
      expect(result.cases.filter((testCase) => testCase.status !== "passed")).toEqual([]);
    },
  );
});
