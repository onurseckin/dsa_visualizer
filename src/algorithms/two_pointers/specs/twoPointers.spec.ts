import { describe, expect, it } from "vitest";
import { generateTwoPointersSteps, twoPointers } from "../twoPointers";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("twoPointers algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(twoPointers.id).toBe("two-pointers");
    expect(twoPointers.title).toContain("Two Pointers");
    expect(twoPointers.category).toBe("two_pointers");
    expect(twoPointers.timeComplexity.average).toBe("O(n)");
    expect(twoPointers.spaceComplexity).toBe("O(1)");
  });

  it("should generate valid steps and find target for default input", () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    const snap = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.currentSum).toBe(12);
    expect(lastStep.variables.left).toBe(1);
    expect(lastStep.variables.right).toBe(3);
  });

  it("should handle empty input array", () => {
    const steps = generateTwoPointersSteps({ array: [], target: 5 });
    expect(steps.length).toBe(2);
    expect(steps[1].variables.left).toBe(-1);
  });

  it("should return [-1, -1] when target is not found", () => {
    const steps = generateTwoPointersSteps({ array: [1, 2, 3], target: 100 });
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.left).toBe(-1);
    expect(lastStep.variables.right).toBe(-1);
  });

  it("should handle single element matching target", () => {
    const steps = generateTwoPointersSteps({ array: [5], target: 5 });
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.left).toBe(0);
    expect(lastStep.variables.right).toBe(0);
  });

  it("should shrink window from the left when sum exceeds target", () => {
    const steps = generateTwoPointersSteps({ array: [10, 1, 2], target: 3 });
    const shrinkStep = steps.find((s) => s.explanation.what.includes("Shrink the window"));
    expect(shrinkStep).toBeDefined();
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.left).toBe(1);
    expect(lastStep.variables.right).toBe(2);
  });
});
