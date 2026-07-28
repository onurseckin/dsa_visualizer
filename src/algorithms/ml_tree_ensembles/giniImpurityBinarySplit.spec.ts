import { describe, it, expect } from "vitest";
import { giniImpurityBinarySplit } from "./giniImpurityBinarySplit";

describe("gini-impurity-binary-split", () => {
  it("should have valid metadata", () => {
    expect(giniImpurityBinarySplit.id).toBeDefined();
    expect(giniImpurityBinarySplit.title).toBeDefined();
    expect(giniImpurityBinarySplit.code).toBeDefined();
    expect(giniImpurityBinarySplit.examples?.length).toBeGreaterThan(0);
    expect(giniImpurityBinarySplit.description.length).toBeGreaterThan(200);
    expect(giniImpurityBinarySplit.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = giniImpurityBinarySplit.generateSteps(giniImpurityBinarySplit.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = giniImpurityBinarySplit.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = giniImpurityBinarySplit.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
