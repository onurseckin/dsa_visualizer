import { describe, it, expect } from "vitest";
import { multiTreeAdditiveEnsemblePredictor } from "./multiTreeAdditiveEnsemblePredictor";

describe("multi-tree-additive-ensemble-predictor", () => {
  it("should have valid metadata", () => {
    expect(multiTreeAdditiveEnsemblePredictor.id).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.title).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.code).toBeDefined();
    expect(multiTreeAdditiveEnsemblePredictor.examples?.length).toBeGreaterThan(0);
    expect(multiTreeAdditiveEnsemblePredictor.description.length).toBeGreaterThan(200);
    expect(multiTreeAdditiveEnsemblePredictor.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = multiTreeAdditiveEnsemblePredictor.generateSteps(
      multiTreeAdditiveEnsemblePredictor.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = multiTreeAdditiveEnsemblePredictor.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = multiTreeAdditiveEnsemblePredictor.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
