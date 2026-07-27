import { describe, it, expect } from "vitest";
import {
  ringScatterReduceArrayAccumulator,
  DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
  generateRingScatterReduceArrayAccumulatorSteps,
} from "./ringScatterReduceArrayAccumulator";

describe("ring-scatter-reduce-array-accumulator (Ring Scatter-Reduce Phase)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(ringScatterReduceArrayAccumulator.id).toBe("ring-scatter-reduce-array-accumulator");
    expect(ringScatterReduceArrayAccumulator.isMlInfra).toBe(true);
    expect(ringScatterReduceArrayAccumulator.mlInfraLevel).toBe(11);
    expect(ringScatterReduceArrayAccumulator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringScatterReduceArrayAccumulator.categories).toContain("ml_distributed_systems");
    expect(ringScatterReduceArrayAccumulator.defaultInput).toEqual(
      DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
    );

    const codeLines = ringScatterReduceArrayAccumulator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      ringScatterReduceArrayAccumulator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(ringScatterReduceArrayAccumulator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateRingScatterReduceArrayAccumulatorSteps(
      DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Complete");
  });
});
