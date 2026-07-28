import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERATING_SUBSETS_INPUT,
  generateGeneratingSubsetsSteps,
  generatingSubsets,
} from "../generatingSubsets";
import { requireExampleInputs, requireLineExplanations } from "../../specs/assertions";

describe("generatingSubsets logic spec", () => {
  it("should have valid metadata", () => {
    expect(generatingSubsets.id).toBe("generating-subsets");
    expect(generatingSubsets.topicIds).toContain("backtracking");
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
    const explanations = requireLineExplanations(generatingSubsets);
    expect(codeLines).toBe(18);
    for (let line = 1; line <= codeLines; line++) {
      expect(explanations[line]).toBeDefined();
    }
  });

  it("should have codeLine in valid range (1..N) for defaultInput and all examples", () => {
    const totalLines = generatingSubsets.code.split("\n").length;
    const inputsToTest = [
      generatingSubsets.defaultInput,
      ...requireExampleInputs(
        generatingSubsets,
        (input): input is typeof generatingSubsets.defaultInput =>
          typeof input === "object" && input !== null,
      ),
    ];

    for (const input of inputsToTest) {
      const steps = generateGeneratingSubsetsSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
    }
  });
});
