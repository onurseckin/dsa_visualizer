import { describe, it, expect } from "vitest";
import {
  ringScatterReduceArrayAccumulator,
  DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
  generateRingScatterReduceArrayAccumulatorSteps,
} from "./ringScatterReduceArrayAccumulator";

describe("ring-scatter-reduce-array-accumulator (Ring Scatter-Reduce Phase)", () => {
  it("should have correct metadata", () => {
    expect(ringScatterReduceArrayAccumulator.id).toBe("ring-scatter-reduce-array-accumulator");
    expect(ringScatterReduceArrayAccumulator.isMlInfra).toBe(true);
    expect(ringScatterReduceArrayAccumulator.mlInfraLevel).toBe(11);
    expect(ringScatterReduceArrayAccumulator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringScatterReduceArrayAccumulator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRingScatterReduceArrayAccumulatorSteps(
      DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Initialize Ring Scatter-Reduce Simulation");
    expect(steps[steps.length - 1].explanation.what).toBe("Scatter-Reduce Complete");
  });
});
