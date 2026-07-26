import { describe, expect, it } from "vitest";
import { DEFAULT_NIM_INPUT, generateNimGameSteps, nimGame } from "../nimGame";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("nimGame algorithm logic spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(nimGame.id).toBe("nim-game");
    expect(nimGame.title).toBe("Nim Game Sprague-Grundy");
    expect(nimGame.category).toBe("game_theory");
    expect(nimGame.difficulty).toBe("Medium");
    expect(nimGame.defaultInput).toEqual(DEFAULT_NIM_INPUT);
  });

  it("should ship a topic guide teaching the Nim-sum and Grundy values", () => {
    const guide = nimGame.topicGuide;
    expect(guide.overview).toContain("Nim-sum");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Grundy value");
  });

  it("should generate valid steps and calculate XOR sum for default input [3, 4, 5]", () => {
    const steps = generateNimGameSteps(DEFAULT_NIM_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.xorSum).toBe(2);
    expect(lastStep.variables.winner).toBe("First Player");
    expect(lastStep.variables.winningPile).toBe(0);
    expect(lastStep.variables.targetSize).toBe(1);

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.kind).toBe("array");
    expect(snapshot.elements.map((el) => el.value)).toEqual([3, 4, 5]);
    expect(snapshot.elements[0].state).toBe("sorted");
  });

  it("should identify P-position (Second Player wins) when XOR sum is 0", () => {
    const steps = generateNimGameSteps({ piles: [1, 2, 3] });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.xorSum).toBe(0);
    expect(lastStep.variables.winner).toBe("Second Player");
    expect(lastStep.explanation.what).toContain("Second Player Wins");
  });

  it("should handle empty piles array", () => {
    const steps = generateNimGameSteps({ piles: [] });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.xorSum).toBe(0);
    expect(lastStep.explanation.what).toContain("complete");
  });

  it("should handle piles where winning move is not on the first pile and fallback input", () => {
    const steps1 = generateNimGameSteps({ piles: [1, 2, 4] });
    const lastStep1 = steps1[steps1.length - 1];
    expect(lastStep1.variables.winner).toBe("First Player");
    expect(lastStep1.variables.winningPile).toBe(2);

    const steps2 = generateNimGameSteps({} as { piles: number[] });
    expect(steps2.length).toBeGreaterThan(0);
  });
});
