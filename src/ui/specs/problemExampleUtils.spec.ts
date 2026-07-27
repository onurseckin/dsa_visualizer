import { describe, expect, it } from "vitest";
import { formatExampleInput, formatExampleOutput } from "../organisms/problemExampleUtils";
import type { ProblemExample } from "../../types/dsa";

describe("problemExampleUtils", () => {
  describe("formatExampleInput", () => {
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
        "root = [3, 9, 20, null, null, 15, 7], p = 5, q = 1"
      );
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
        'grid = [["1", "1", "0"], ["1", "1", "0"], ["0", "0", "1"]]'
      );
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
  });
});
