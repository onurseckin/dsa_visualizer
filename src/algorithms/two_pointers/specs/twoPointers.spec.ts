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

  it("should generate valid steps and find target for default input (>= 20 steps)", () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    const snap = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");

    const returnStep = steps.find((s) => s.explanation.what.includes("Return window bounds"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.left).toBe(1);
    expect(returnStep?.variables.right).toBe(3);
    expect(returnStep?.variables.currentSum).toBe(12);
  });

  it("should handle empty input array with >= 20 steps", () => {
    const steps = generateTwoPointersSteps({ array: [], target: 5 });
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const returnStep = steps.find((s) => s.explanation.what.includes("Return [-1, -1]"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.left).toBe(-1);
  });

  it("should return [-1, -1] when target is not found (>= 20 steps)", () => {
    const steps = generateTwoPointersSteps({ array: [1, 2, 3], target: 100 });
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const returnStep = steps.find((s) => s.explanation.what.includes("Return [-1, -1]"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.left).toBe(-1);
    expect(returnStep?.variables.right).toBe(-1);
  });

  it("should handle single element matching target (>= 20 steps)", () => {
    const steps = generateTwoPointersSteps({ array: [5], target: 5 });
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const returnStep = steps.find((s) => s.explanation.what.includes("Return window bounds"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.left).toBe(0);
    expect(returnStep?.variables.right).toBe(0);
  });

  it("should shrink window from the left when sum exceeds target", () => {
    const steps = generateTwoPointersSteps({ array: [10, 1, 2], target: 3 });
    const shrinkStep = steps.find((s) => s.explanation.what.includes("Shrink window"));
    expect(shrinkStep).toBeDefined();
    const returnStep = steps.find((s) => s.explanation.what.includes("Return window bounds"));
    expect(returnStep).toBeDefined();
    expect(returnStep?.variables.left).toBe(1);
    expect(returnStep?.variables.right).toBe(2);
  });

  it("maps every code line in lineExplanations", () => {
    const meta = twoPointers.trivia;
    const lines = twoPointers.code.split("\n");
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("ensures codeLine is 1-indexed and within total lines N for all inputs", () => {
    const N = twoPointers.code.split("\n").length;
    const inputs = [
      twoPointers.defaultInput,
      ...(twoPointers.examples?.map((e) => e.input) ?? []),
    ];

    for (const inp of inputs) {
      const steps = twoPointers.generateSteps(inp);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(N);
      }
    }
  });
});
