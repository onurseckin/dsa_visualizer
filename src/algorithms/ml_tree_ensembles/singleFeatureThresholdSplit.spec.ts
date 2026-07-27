import { describe, it, expect } from "vitest";
import { singleFeatureThresholdSplit } from "./singleFeatureThresholdSplit";

describe("singleFeatureThresholdSplit", () => {
  it("should have valid metadata", () => {
    expect(singleFeatureThresholdSplit.id).toBeDefined();
    expect(singleFeatureThresholdSplit.title).toBeDefined();
    expect(singleFeatureThresholdSplit.code).toBeDefined();
    expect(singleFeatureThresholdSplit.examples?.length).toBeGreaterThan(0);
    expect(singleFeatureThresholdSplit.description.length).toBeGreaterThan(200);
    expect(singleFeatureThresholdSplit.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = singleFeatureThresholdSplit.generateSteps(
      singleFeatureThresholdSplit.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = singleFeatureThresholdSplit.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = singleFeatureThresholdSplit.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
