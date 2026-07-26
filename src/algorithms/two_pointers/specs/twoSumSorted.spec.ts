import { describe, expect, it } from "vitest";
import {
  DEFAULT_TWO_SUM_SORTED_INPUT,
  generateTwoSumSortedSteps,
  twoSumSorted,
} from "../twoSumSorted";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("twoSumSorted algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(twoSumSorted.id).toBe("two-sum-sorted");
    expect(twoSumSorted.title).toBe("Two Sum II (Sorted)");
    expect(twoSumSorted.category).toBe("two_pointers");
    expect(twoSumSorted.difficulty).toBe("Easy");
    expect(twoSumSorted.defaultInput).toEqual(DEFAULT_TWO_SUM_SORTED_INPUT);
  });

  it("should find target pair with two pointers on default input", () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.resultIdx1).toBe(0);
    expect(lastStep.variables.resultIdx2).toBe(6);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements[0].state).toBe("sorted");
    expect(snap.elements[6].state).toBe("sorted");
  });

  it("should adjust left pointer when sum is less than target", () => {
    const input = { nums: [1, 2, 3, 9], target: 12 };
    const steps = generateTwoSumSortedSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.resultIdx1).toBe(2);
    expect(lastStep.variables.resultIdx2).toBe(3);
  });

  it("should return empty step when no pair sums to target", () => {
    const input = { nums: [1, 2, 4], target: 100 };
    const steps = generateTwoSumSortedSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(15);
    expect(lastStep.explanation.what).toContain("Return empty array");
  });

  it("should pull right pointer back when sum exceeds target", () => {
    const input = { nums: [1, 5, 10, 20], target: 6 };
    const steps = generateTwoSumSortedSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.resultIdx1).toBe(0);
    expect(lastStep.variables.resultIdx2).toBe(1);

    const rightDecrementStep = steps.find((s) => s.explanation.what.includes("Pull right back"));
    expect(rightDecrementStep).toBeDefined();
  });

  it("should handle empty input array", () => {
    const input = { nums: [], target: 5 };
    const steps = generateTwoSumSortedSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(15);
    expect(lastStep.explanation.what).toContain("Return empty array");
  });
});
