import { describe, expect, it } from "vitest";
import {
  DEFAULT_KNIGHTS_TOUR_INPUT,
  generateKnightsTourWarnsdorffSteps,
  knightsTourWarnsdorff,
} from "../knightsTourWarnsdorff";

describe("knightsTourWarnsdorff logic spec", () => {
  it("should have valid metadata", () => {
    expect(knightsTourWarnsdorff.id).toBe("knights-tour-warnsdorff");
    expect(knightsTourWarnsdorff.category).toBe("backtracking");
    expect(knightsTourWarnsdorff.difficulty).toBe("Medium");
  });

  it("should generate >= 20 steps for default input (5x5 board)", () => {
    const steps = generateKnightsTourWarnsdorffSteps(DEFAULT_KNIGHTS_TOUR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);
    expect(lastStep.variables.totalSquares).toBe(25);
  });

  it("should map every line of python code in trivia lineExplanations", () => {
    const codeLines = knightsTourWarnsdorff.code.split("\n").length;
    expect(codeLines).toBe(30);
    for (let line = 1; line <= codeLines; line++) {
      expect(knightsTourWarnsdorff.trivia?.lineExplanations[line]).toBeDefined();
    }
  });

  it("should have codeLine in valid range (1..N) for defaultInput and all examples", () => {
    const totalLines = knightsTourWarnsdorff.code.split("\n").length;
    const inputsToTest = [
      knightsTourWarnsdorff.defaultInput,
      ...(knightsTourWarnsdorff.examples?.map((e) => e.input) ?? []),
    ];

    for (const input of inputsToTest) {
      const steps = generateKnightsTourWarnsdorffSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
    }
  });
});
