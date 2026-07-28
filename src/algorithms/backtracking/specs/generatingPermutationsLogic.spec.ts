import { describe, expect, it } from "vitest";
import {
  DEFAULT_GENERATING_PERMUTATIONS_INPUT,
  generateGeneratingPermutationsSteps,
  generatingPermutations,
} from "../generatingPermutations";
import { requireExampleInputs, requireLineExplanations } from "../../specs/assertions";

describe("generatingPermutations logic spec", () => {
  it("should have valid metadata", () => {
    expect(generatingPermutations.id).toBe("generating-permutations");
    expect(generatingPermutations.topicIds).toContain("backtracking");
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
    const explanations = requireLineExplanations(generatingPermutations);
    expect(codeLines).toBe(20);
    for (let line = 1; line <= codeLines; line++) {
      expect(explanations[line]).toBeDefined();
    }
  });

  it("should have codeLine in valid range (1..N) for defaultInput and all examples", () => {
    const totalLines = generatingPermutations.code.split("\n").length;
    const inputsToTest = [
      generatingPermutations.defaultInput,
      ...requireExampleInputs(
        generatingPermutations,
        (input): input is typeof generatingPermutations.defaultInput =>
          typeof input === "object" && input !== null,
      ),
    ];

    for (const input of inputsToTest) {
      const steps = generateGeneratingPermutationsSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
    }
  });
});
