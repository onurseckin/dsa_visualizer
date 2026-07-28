import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEAREST_SMALLER_INPUT,
  generateNearestSmallerElementSteps,
  nearestSmallerElement,
} from "../nearestSmallerElement";

describe("nearestSmallerElement algorithm spec", () => {
  it("should have valid metadata", () => {
    expect(nearestSmallerElement.id).toBe("nearest-smaller-element");
    expect(nearestSmallerElement.title).toBe("Nearest Smaller Element");
    expect(nearestSmallerElement.topicIds).toContain("stack_and_queue");
    expect(nearestSmallerElement.difficulty).toBe("Medium");
    expect(nearestSmallerElement.defaultInput).toEqual(DEFAULT_NEAREST_SMALLER_INPUT);
  });

  it("should produce >= 20 steps for default input", () => {
    const steps = generateNearestSmallerElementSteps(DEFAULT_NEAREST_SMALLER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(13);
    expect(lastStep.variables.result).toBe("-1, -1, 4, -1, 2, 2, 2, 7, -1, 1");
  });

  it("should map every non-blank code line in lineExplanations", () => {
    const codeLines = nearestSmallerElement.code.split("\n");
    const lineExplanations = nearestSmallerElement.trivia?.lineExplanations || {};
    const skipLines = nearestSmallerElement.trivia?.skipLines || [];

    codeLines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const isBlank = lineText.trim() === "";
      if (!isBlank && !skipLines.includes(lineNum)) {
        expect(lineExplanations[lineNum]).toBeDefined();
        expect(lineExplanations[lineNum].length).toBeGreaterThan(10);
      }
    });
  });

  it("should compute correct nearest smaller elements for decreasing array", () => {
    const input = { nums: [5, 4, 3, 2, 1] };
    const steps = generateNearestSmallerElementSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe("-1, -1, -1, -1, -1");
  });

  it("should compute correct nearest smaller elements for increasing array", () => {
    const input = { nums: [1, 2, 3, 4, 5] };
    const steps = generateNearestSmallerElementSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe("-1, 1, 2, 3, 4");
  });
});
