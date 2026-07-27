import { describe, expect, it } from "vitest";
import { binarySearch1d, generateBinarySearch1dSteps } from "../binarySearch1d";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("binarySearch1d algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(binarySearch1d.id).toBe("binary-search-1d");
    expect(binarySearch1d.title).toContain("1D Binary Search");
    expect(binarySearch1d.category).toBe("binary_search");
    expect(binarySearch1d.timeComplexity.average).toBe("O(log n)");
    expect(binarySearch1d.spaceComplexity).toBe("O(1)");
  });

  it("should generate valid steps for default input", () => {
    const steps = generateBinarySearch1dSteps(binarySearch1d.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const matchStep = steps.find((s) => s.explanation.what.includes("found at index"));
    expect(matchStep).toBeDefined();
  });

  it("should handle lower_bound mode", () => {
    const steps = generateBinarySearch1dSteps({
      array: [1, 3, 3, 3, 5, 7],
      target: 3,
      mode: "lower_bound",
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Lower bound");
  });

  it("should handle empty input array", () => {
    const steps = generateBinarySearch1dSteps({ array: [], target: 5 });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(binarySearch1d.examples).toHaveLength(3);
    expect(binarySearch1d.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of binarySearch1d.examples!) {
      const steps = binarySearch1d.generateSteps(example.input as { array: number[]; target: number; mode?: "exact" | "lower_bound" | "upper_bound" });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
