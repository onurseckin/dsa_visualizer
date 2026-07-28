import { describe, expect, it } from "vitest";
import {
  knapsack01,
  generateKnapsack01Steps,
  DEFAULT_KNAPSACK_01_INPUT,
  type Knapsack01Input,
} from "../knapsack01";

describe("knapsack01 algorithm logic spec", () => {
  it("has categories ['dp_1d'] and valid metadata", () => {
    expect(knapsack01.id).toBe("knapsack-01");
    expect(knapsack01.topicIds).toEqual(["dp_1d"]);
    expect(knapsack01.difficulty).toBe("Medium");
    expect(knapsack01.code).toContain("def knapsack_01");
  });

  it("generates valid steps for default input", () => {
    const steps = generateKnapsack01Steps(DEFAULT_KNAPSACK_01_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("array");
    expect(lastStep.variables.result).toBe(37);
  });

  it("handles case where no items fit", () => {
    const steps = generateKnapsack01Steps({
      weights: [10, 20],
      values: [60, 100],
      capacity: 5,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(0);
  });

  it("handles empty / default input fallback", () => {
    const steps = generateKnapsack01Steps({} as Knapsack01Input);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(knapsack01.examples).toHaveLength(3);
    expect(knapsack01.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);

    for (const example of knapsack01.examples!) {
      const steps = knapsack01.generateSteps(example.input as Knapsack01Input);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
