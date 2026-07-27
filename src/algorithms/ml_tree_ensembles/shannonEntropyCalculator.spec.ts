import { describe, it, expect } from "vitest";
import { shannonEntropyCalculator } from "./shannonEntropyCalculator";

describe("shannonEntropyCalculator", () => {
  it("should have valid metadata", () => {
    expect(shannonEntropyCalculator.id).toBeDefined();
    expect(shannonEntropyCalculator.title).toBeDefined();
    expect(shannonEntropyCalculator.code).toBeDefined();
    expect(shannonEntropyCalculator.examples?.length).toBeGreaterThan(0);
    expect(shannonEntropyCalculator.description.length).toBeGreaterThan(200);
    expect(shannonEntropyCalculator.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = shannonEntropyCalculator.generateSteps(
      shannonEntropyCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = shannonEntropyCalculator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = shannonEntropyCalculator.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
