import { describe, expect, it } from "vitest";
import { sqrtDecomposition, generateSqrtDecompositionSteps } from "../sqrtDecomposition";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("sqrtDecomposition algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(sqrtDecomposition.id).toBe("sqrt-decomposition");
    expect(sqrtDecomposition.title).toContain("SQRT Decomposition");
    expect(sqrtDecomposition.category).toBe("advanced_range_queries");
    expect(sqrtDecomposition.timeComplexity.average).toBe("O(sqrt n)");
    expect(sqrtDecomposition.spaceComplexity).toBe("O(n)");
  });

  it("should generate valid steps for default input", () => {
    const steps = generateSqrtDecompositionSteps(sqrtDecomposition.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const querySteps = steps.filter((s) => s.explanation.what.includes("Query"));
    expect(querySteps.length).toBeGreaterThan(0);
  });

  it("should handle single element input array", () => {
    const steps = generateSqrtDecompositionSteps({
      array: [10],
      operations: [{ type: "query", left: 0, right: 0 }],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("should handle empty input array", () => {
    const steps = generateSqrtDecompositionSteps({ array: [], operations: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(sqrtDecomposition.examples).toHaveLength(3);
    expect(sqrtDecomposition.examples?.map((ex) => ex.kind)).toEqual([
      "basic",
      "complex",
      "negative",
    ]);

    for (const example of sqrtDecomposition.examples!) {
      const steps = sqrtDecomposition.generateSteps(
        example.input as {
          array: number[];
          operations: {
            type: "query" | "update";
            left?: number;
            right?: number;
            index?: number;
            value?: number;
          }[];
        },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
