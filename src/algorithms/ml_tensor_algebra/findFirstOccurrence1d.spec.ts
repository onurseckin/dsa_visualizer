import { describe, it, expect } from "vitest";
import {
  findFirstOccurrence1d,
  DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT,
  generateFindFirstOccurrence1dSteps,
} from "./findFirstOccurrence1d";

describe("find-first-occurrence-1d (Find First Occurrence in 1D Buffer)", () => {
  it("should have correct metadata", () => {
    expect(findFirstOccurrence1d.id).toBe("find-first-occurrence-1d");
    expect(findFirstOccurrence1d.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(findFirstOccurrence1d.topicIds).toContain("ml_tensor_algebra");
    expect(findFirstOccurrence1d.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate algorithm steps with array snapshots", () => {
    const steps = generateFindFirstOccurrence1dSteps(DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(10);
    expect(steps[0].explanation.what).toContain("Strided 1D Memory Scan");
    expect(steps[0].primarySnapshot.kind).toBe("array");
    expect(steps[steps.length - 1].explanation.what).toContain(
      "Return Match Physical Offset Result",
    );
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = findFirstOccurrence1d.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = findFirstOccurrence1d.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });

  it("should handle strided search and missing target without errors", () => {
    const stepsStrided = generateFindFirstOccurrence1dSteps({
      data: [10, 99, 20, 99, 30, 99],
      target: 30,
      stride: 2,
    });
    expect(stepsStrided.length).toBeGreaterThan(0);
    const lastStepStrided = stepsStrided[stepsStrided.length - 1];
    expect(lastStepStrided.variables.result_index).toBe(4);

    const stepsMissing = generateFindFirstOccurrence1dSteps({
      data: [5, 10, 15, 20],
      target: 99,
      stride: 1,
    });
    expect(stepsMissing.length).toBeGreaterThan(0);
    const lastStepMissing = stepsMissing[stepsMissing.length - 1];
    expect(lastStepMissing.variables.result_index).toBe(-1);
  });
});
