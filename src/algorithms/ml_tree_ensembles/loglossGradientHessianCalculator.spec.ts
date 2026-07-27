import { describe, it, expect } from "vitest";
import { loglossGradientHessianCalculator } from "./loglossGradientHessianCalculator";

describe("loglossGradientHessianCalculator", () => {
  it("should have valid metadata", () => {
    expect(loglossGradientHessianCalculator.id).toBeDefined();
    expect(loglossGradientHessianCalculator.title).toBeDefined();
    expect(loglossGradientHessianCalculator.code).toBeDefined();
    expect(loglossGradientHessianCalculator.examples?.length).toBeGreaterThan(0);
    expect(loglossGradientHessianCalculator.description.length).toBeGreaterThan(200);
    expect(loglossGradientHessianCalculator.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = loglossGradientHessianCalculator.generateSteps(
      loglossGradientHessianCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = loglossGradientHessianCalculator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = loglossGradientHessianCalculator.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
