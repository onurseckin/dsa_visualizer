import { describe, expect, it } from "vitest";
import { moAlgorithm, generateMoAlgorithmSteps } from "../moAlgorithm";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("moAlgorithm algorithm spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(moAlgorithm.id).toBe("mo-algorithm");
    expect(moAlgorithm.title).toContain("Mo's Algorithm");
    expect(moAlgorithm.category).toBe("advanced_range_queries");
    expect(moAlgorithm.timeComplexity.average).toContain("sqrt");
    expect(moAlgorithm.spaceComplexity).toBe("O(n + q)");
  });

  it("should generate valid steps for default input", () => {
    const steps = generateMoAlgorithmSteps(moAlgorithm.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const querySteps = steps.filter((s) => s.explanation.what.includes("Processing Query"));
    expect(querySteps.length).toBeGreaterThan(0);
  });

  it("should handle single element input array", () => {
    const steps = generateMoAlgorithmSteps({
      array: [100],
      queries: [{ left: 0, right: 0 }],
    });
    expect(steps.length).toBeGreaterThan(0);
  });

  it("should handle empty input array", () => {
    const steps = generateMoAlgorithmSteps({ array: [], queries: [] });
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("empty");
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(moAlgorithm.examples).toHaveLength(3);
    expect(moAlgorithm.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of moAlgorithm.examples!) {
      const steps = moAlgorithm.generateSteps(
        example.input as { array: number[]; queries: { left: number; right: number }[] },
      );
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
