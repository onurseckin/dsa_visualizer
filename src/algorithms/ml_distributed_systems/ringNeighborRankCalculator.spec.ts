import { describe, it, expect } from "vitest";
import {
  ringNeighborRankCalculator,
  DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT,
  generateRingNeighborRankCalculatorSteps,
} from "./ringNeighborRankCalculator";

describe("ring-neighbor-rank-calculator (Ring Topology Neighbor Rank Calculator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(ringNeighborRankCalculator.id).toBe("ring-neighbor-rank-calculator");
    expect(ringNeighborRankCalculator.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(ringNeighborRankCalculator.topicIds).toContain("ml_distributed_systems");
    expect(ringNeighborRankCalculator.topicIds).toContain("ml_distributed_systems");
    expect(ringNeighborRankCalculator.defaultInput).toEqual(
      DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT,
    );

    const codeLines = ringNeighborRankCalculator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      ringNeighborRankCalculator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(ringNeighborRankCalculator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateRingNeighborRankCalculatorSteps(DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
