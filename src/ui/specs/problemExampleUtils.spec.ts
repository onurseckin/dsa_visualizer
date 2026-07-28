import { describe, expect, it } from "vitest";
import {
  formatExampleInput,
  formatExampleOutput,
  formatVal,
} from "../organisms/problemExampleUtils";
import type { ProblemExample } from "../../types/dsa";

describe("problemExampleUtils", () => {
  describe("formatExampleInput", () => {
    it("formats nullish values and preserves already-quoted object property strings", () => {
      expect(formatVal(null)).toBe("null");
      expect(formatVal(undefined)).toBe("");
      expect(formatVal('"already quoted"', true)).toBe('"already quoted"');
      expect(formatVal("'already quoted'", true)).toBe("'already quoted'");
      expect(formatVal(Symbol("id"))).toBe("Symbol(id)");
    });

    it("returns inputDisplay if explicitly specified", () => {
      const example: ProblemExample = {
        input: { nums: [1, 2, 3] },
        inputDisplay: "Custom Input String",
      };
      expect(formatExampleInput(example)).toBe("Custom Input String");
    });

    it("converts tree object nodes into clean LeetCode array strings", () => {
      const example: ProblemExample = {
        input: {
          rootId: "3",
          pVal: 5,
          qVal: 1,
          nodes: [
            { id: "3", val: 3, leftId: "9", rightId: "20" },
            { id: "9", val: 9 },
            { id: "20", val: 20, leftId: "15", rightId: "7" },
            { id: "15", val: 15 },
            { id: "7", val: 7 },
          ],
        },
      };
      expect(formatExampleInput(example)).toBe(
        "root = [3, 9, 20, null, null, 15, 7], p = 5, q = 1",
      );
    });

    it("formats root arrays, primitive roots, and sparse node references", () => {
      expect(formatExampleInput({ input: { root: [1, null, 2] } })).toBe("root = [1, null, 2]");
      expect(formatExampleInput({ input: { root: 7 } })).toBe("root = 7");
      expect(
        formatExampleInput({
          input: {
            nodes: [
              { id: "root", value: "root", left: "missing", right: "right" },
              { id: "right", value: 2 },
            ],
          },
        }),
      ).toBe('root = ["root", null, 2]');
    });

    it("converts linked list nodes into clean LeetCode array strings", () => {
      const example: ProblemExample = {
        input: {
          headId: "1",
          nodes: [
            { id: "1", val: 1, nextId: "2" },
            { id: "2", val: 2, nextId: "3" },
            { id: "3", val: 3, nextId: "4" },
            { id: "4", val: 4, nextId: "5" },
            { id: "5", val: 5 },
          ],
        },
      };
      expect(formatExampleInput(example)).toBe("head = [1, 2, 3, 4, 5]");
    });

    it("formats direct linked-list heads and infers a head when it is omitted", () => {
      expect(formatExampleInput({ input: { head: [1, 2] } })).toBe("head = [1, 2]");
      expect(
        formatExampleInput({
          input: { head: { value: 1, next: { value: 2, next: null } } },
        }),
      ).toBe("head = [1, 2]");
      expect(
        formatExampleInput({
          input: {
            nodes: [
              { id: "a", value: 1, next: "b" },
              { id: "b", value: 2 },
            ],
          },
        }),
      ).toBe("head = [1, 2]");
    });

    it("converts graph edges and n into clean LeetCode strings", () => {
      const example: ProblemExample = {
        input: {
          n: 5,
          edges: [
            { from: "0", to: "1" },
            { from: "1", to: "2" },
          ],
        },
      };
      expect(formatExampleInput(example)).toBe("n = 5, edges = [[0, 1], [1, 2]]");
    });

    it("converts grid matrices into clean LeetCode strings", () => {
      const example: ProblemExample = {
        input: {
          grid: [
            ["1", "1", "0"],
            ["1", "1", "0"],
            ["0", "0", "1"],
          ],
        },
      };
      expect(formatExampleInput(example)).toBe(
        'grid = [["1", "1", "0"], ["1", "1", "0"], ["0", "0", "1"]]',
      );
    });

    it("uses any supported grid key and gives edges without dimensions an edge-only representation", () => {
      expect(formatExampleInput({ input: { board: [[1, 0]] } })).toBe("board = [[1, 0]]");
      expect(formatExampleInput({ input: { edges: [["a", "b"]] } })).toBe('edges = [["a", "b"]]');
    });

    it("converts raw objects into clean problem-style var = val parameter representations", () => {
      const example: ProblemExample = {
        input: {
          nums: [2, 7, 11, 15],
          target: 9,
        },
      };
      expect(formatExampleInput(example)).toBe("nums = [2, 7, 11, 15], target = 9");
    });

    it("handles raw string inputs gracefully", () => {
      const example: ProblemExample = {
        input: "nums = [2,7,11,15], target = 9",
      };
      expect(formatExampleInput(example)).toBe("nums = [2,7,11,15], target = 9");
    });

    it("parses JSON object input while preserving quoted property strings", () => {
      const example: ProblemExample = {
        input: '{"n":"5","label":"node"}',
      };

      expect(formatExampleInput(example)).toBe('n = "5", label = "node"');
    });

    it("leaves malformed JSON and non-object inputs unchanged or directly formatted", () => {
      expect(formatExampleInput({ input: "{not valid json}" })).toBe("{not valid json}");
      expect(formatExampleInput({ input: [1, 2, 3] })).toBe("[1, 2, 3]");
      expect(formatExampleInput({ input: null })).toBe("");
    });

    it("prefers inputValue and ignores presentation-only object keys", () => {
      expect(
        formatExampleInput({
          input: { ignored: true },
          inputValue: { id: "example", kind: "basic", state: "active", title: "Demo", nVal: 4 },
        }),
      ).toBe("n = 4");
    });

    it("formats nested root objects and terminates cyclic linked-list node records", () => {
      expect(
        formatExampleInput({
          input: {
            root: { value: 4, left: { value: 2 }, right: { value: 6 } },
          },
        }),
      ).toBe("root = [4, 2, 6]");

      expect(
        formatExampleInput({
          input: {
            nodes: [
              { id: "a", value: "A", next: "b" },
              { id: "b", value: "B", next: "a" },
            ],
          },
        }),
      ).toBe('head = ["A", "B"]');
    });

    it("formats weighted graph edges and derives n from a nodes array", () => {
      const example: ProblemExample = {
        input: {
          nodes: ["a", "b", "c"],
          edges: [{ from: "0", to: "2", weight: "7" }],
        },
      };

      expect(formatExampleInput(example)).toBe("n = 3, edges = [[0, 2, 7]]");
    });
  });

  describe("formatExampleOutput", () => {
    it("returns outputDisplay if present", () => {
      const example: ProblemExample = {
        input: "test",
        output: "[0,1]",
        outputDisplay: "Formatted [0, 1]",
      };
      expect(formatExampleOutput(example)).toBe("Formatted [0, 1]");
    });

    it("formats string output", () => {
      const example: ProblemExample = {
        input: "test",
        output: "[0,1]",
      };
      expect(formatExampleOutput(example)).toBe("[0,1]");
    });

    it("formats raw array or primitive outputs", () => {
      expect(formatExampleOutput([0, 1])).toBe("[0, 1]");
      expect(formatExampleOutput(42)).toBe("42");
      expect(formatExampleOutput(true)).toBe("true");
    });

    it("returns empty output for an identified example with no value and preserves raw objects", () => {
      expect(formatExampleOutput({ input: "test", outputDisplay: "" })).toBe("");
      expect(formatExampleOutput({ input: "test" })).toBe('{"input":"test"}');
      expect(formatExampleOutput(null)).toBe("");
      expect(formatExampleOutput(undefined)).toBe("");
    });
  });
});
