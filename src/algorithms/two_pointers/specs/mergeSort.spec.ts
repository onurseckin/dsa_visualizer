import { describe, expect, it } from "vitest";
import { mergeSort, generateMergeSortSteps } from "../mergeSort";
import type { ArrayVisualSnapshot } from "../../../types/dsa";
import { requireExampleInputs } from "../../specs/assertions";

describe("mergeSort algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(mergeSort.id).toBe("merge-sort");
    expect(mergeSort.title).toContain("Merge Sort");
    expect(mergeSort.topicIds).toContain("two_pointers");
    expect(mergeSort.timeComplexity.average).toBe("O(n log n)");
    expect(mergeSort.spaceComplexity).toBe("O(n)");
  });

  it("should generate valid steps for default input (>= 20 steps)", () => {
    const steps = generateMergeSortSteps(mergeSort.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");
  });

  it("should handle single element input array (>= 20 steps)", () => {
    const steps = generateMergeSortSteps({ array: [7] });
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const baseStep = steps.find((s) => s.explanation.what.includes("Base case"));
    expect(baseStep).toBeDefined();
  });

  it("should handle empty input array (>= 20 steps)", () => {
    const steps = generateMergeSortSteps({ array: [] });
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const baseStep = steps.find((s) => s.explanation.what.includes("Base case"));
    expect(baseStep).toBeDefined();
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(mergeSort.examples).toHaveLength(3);
    expect(mergeSort.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const input of requireExampleInputs(
      mergeSort,
      (value): value is typeof mergeSort.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = mergeSort.generateSteps(input);
      expect(steps.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("maps every code line in lineExplanations", () => {
    const meta = mergeSort.trivia;
    const lines = mergeSort.code.split("\n");
    expect(meta?.lineExplanations).toBeDefined();
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      expect(meta?.lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("ensures codeLine is 1-indexed and within total lines N for all inputs", () => {
    const N = mergeSort.code.split("\n").length;
    const inputs = [
      mergeSort.defaultInput,
      ...requireExampleInputs(
        mergeSort,
        (input): input is typeof mergeSort.defaultInput =>
          typeof input === "object" && input !== null,
      ),
    ];

    for (const inp of inputs) {
      const steps = mergeSort.generateSteps(inp);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(N);
      }
    }
  });
});
