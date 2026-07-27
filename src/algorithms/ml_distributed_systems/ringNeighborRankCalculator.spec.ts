import { describe, it, expect } from "vitest";
import {
  ringNeighborRankCalculator,
  DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT,
  generateRingNeighborRankCalculatorSteps,
} from "./ringNeighborRankCalculator";

describe("ring-neighbor-rank-calculator (Ring Topology Neighbor Rank Calculator)", () => {
  it("should have correct metadata", () => {
    expect(ringNeighborRankCalculator.id).toBe("ring-neighbor-rank-calculator");
    expect(ringNeighborRankCalculator.isMlInfra).toBe(true);
    expect(ringNeighborRankCalculator.mlInfraLevel).toBe(11);
    expect(ringNeighborRankCalculator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringNeighborRankCalculator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRingNeighborRankCalculatorSteps(DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Ring Topology Neighbor Rank Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
