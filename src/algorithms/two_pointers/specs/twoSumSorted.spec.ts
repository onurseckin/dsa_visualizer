import { describe, expect, it } from "vitest";
import {
  DEFAULT_TWO_SUM_SORTED_INPUT,
  generateTwoSumSortedSteps,
  twoSumSorted,
} from "../twoSumSorted";
import type { ArrayVisualSnapshot } from "../../../types/dsa";
import { requireExampleInputs } from "../../specs/assertions";

describe("twoSumSorted algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(twoSumSorted.id).toBe("two-sum-sorted");
    expect(twoSumSorted.title).toBe("Two Sum II (Sorted)");
    expect(twoSumSorted.topicIds).toContain("two_pointers");
    expect(twoSumSorted.difficulty).toBe("Medium");
    expect(twoSumSorted.defaultInput).toEqual(DEFAULT_TWO_SUM_SORTED_INPUT);
  });

  it("should find target pair with two pointers on default input (>= 20 steps)", () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const returnStep = steps.find((s) => s.explanation.what.includes("Return matching pair"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.resultIdx1).toBe(0);
    expect(returnStep?.variables.resultIdx2).toBe(5);

    const snap = returnStep?.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements[0].state).toBe("sorted");
    expect(snap.elements[5].state).toBe("sorted");
  });

  it("should adjust left pointer when sum is less than target", () => {
    const input = { nums: [1, 2, 3, 9], target: 12 };
    const steps = generateTwoSumSortedSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const returnStep = steps.find((s) => s.explanation.what.includes("Return matching pair"));
    expect(returnStep?.variables.resultIdx1).toBe(2);
    expect(returnStep?.variables.resultIdx2).toBe(3);
  });

  it("should return empty step when no pair sums to target", () => {
    const input = { nums: [1, 2, 4], target: 100 };
    const steps = generateTwoSumSortedSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const emptyStep = steps.find((s) => s.explanation.what.includes("Return empty array"));
    expect(emptyStep).toBeDefined();
  });

  it("should pull right pointer back when sum exceeds target", () => {
    const input = { nums: [1, 5, 10, 20], target: 6 };
    const steps = generateTwoSumSortedSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const returnStep = steps.find((s) => s.explanation.what.includes("Return matching pair"));
    expect(returnStep?.variables.resultIdx1).toBe(0);
    expect(returnStep?.variables.resultIdx2).toBe(1);
  });

  it("should handle empty input array", () => {
    const input = { nums: [], target: 5 };
    const steps = generateTwoSumSortedSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const emptyStep = steps.find((s) => s.explanation.what.includes("Return empty array"));
    expect(emptyStep).toBeDefined();
  });

  it("maps every code line in lineExplanations", () => {
    const meta = twoSumSorted.trivia;
    const lines = twoSumSorted.code.split("\n");
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("ensures codeLine is 1-indexed and within total lines N for all inputs", () => {
    const N = twoSumSorted.code.split("\n").length;
    const inputs = [
      twoSumSorted.defaultInput,
      ...requireExampleInputs(
        twoSumSorted,
        (input): input is typeof twoSumSorted.defaultInput =>
          typeof input === "object" && input !== null,
      ),
    ];

    for (const inp of inputs) {
      const steps = twoSumSorted.generateSteps(inp);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(N);
      }
    }
  });
});
