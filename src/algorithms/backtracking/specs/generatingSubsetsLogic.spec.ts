import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERATING_SUBSETS_INPUT,
  generateGeneratingSubsetsSteps,
  generatingSubsets,
} from "../generatingSubsets";

describe("generatingSubsets logic spec", () => {
  it("should have valid metadata", () => {
    expect(generatingSubsets.id).toBe("generating-subsets");
    expect(generatingSubsets.category).toBe("backtracking");
    expect(generatingSubsets.difficulty).toBe("Easy");
  });

  it("should generate >= 20 steps for default input [1, 2, 3]", () => {
    const steps = generateGeneratingSubsetsSteps(DEFAULT_GENERATING_SUBSETS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);
    expect(lastStep.variables.totalSubsets).toBe(8);
  });

  it("should map every line of python code in trivia lineExplanations", () => {
    const codeLines = generatingSubsets.code.split("\n").length;
    expect(codeLines).toBe(18);
    for (let line = 1; line <= codeLines; line++) {
      expect(generatingSubsets.trivia?.lineExplanations[line]).toBeDefined();
    }
  });
});
