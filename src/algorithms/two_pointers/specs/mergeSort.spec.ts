import { describe, expect, it } from "vitest";
import { mergeSort, generateMergeSortSteps } from "../mergeSort";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("mergeSort algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(mergeSort.id).toBe("merge-sort");
    expect(mergeSort.title).toContain("Merge Sort");
    expect(mergeSort.category).toBe("two_pointers");
    expect(mergeSort.timeComplexity.average).toBe("O(n log n)");
    expect(mergeSort.spaceComplexity).toBe("O(n)");
  });

  it("should generate valid steps for default input", () => {
    const steps = generateMergeSortSteps(mergeSort.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");
  });

  it("should handle single element input array", () => {
    const steps = generateMergeSortSteps({ array: [7] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("Base case");
  });

  it("should handle empty input array", () => {
    const steps = generateMergeSortSteps({ array: [] });
    expect(steps.length).toBe(2);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(mergeSort.examples).toHaveLength(3);
    expect(mergeSort.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of mergeSort.examples!) {
      const steps = mergeSort.generateSteps(example.input as { array: number[] });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
