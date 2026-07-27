import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERATING_PERMUTATIONS_INPUT,
  generateGeneratingPermutationsSteps,
  generatingPermutations,
} from "../generatingPermutations";

describe("generatingPermutations logic spec", () => {
  it("should have valid metadata", () => {
    expect(generatingPermutations.id).toBe("generating-permutations");
    expect(generatingPermutations.category).toBe("backtracking");
    expect(generatingPermutations.difficulty).toBe("Medium");
  });

  it("should generate >= 20 steps for default input [1, 2, 3]", () => {
    const steps = generateGeneratingPermutationsSteps(DEFAULT_GENERATING_PERMUTATIONS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);
    expect(lastStep.variables.totalPermutations).toBe(6);
  });

  it("should map every line of python code in trivia lineExplanations", () => {
    const codeLines = generatingPermutations.code.split("\n").length;
    expect(codeLines).toBe(20);
    for (let line = 1; line <= codeLines; line++) {
      expect(generatingPermutations.trivia?.lineExplanations[line]).toBeDefined();
    }
  });
});
