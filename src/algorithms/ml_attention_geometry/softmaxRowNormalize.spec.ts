import { describe, it, expect } from "vitest";
import {
  softmaxRowNormalize,
  DEFAULT_SOFTMAXROWNORMALIZE_INPUT,
  generateSoftmaxRowNormalizeSteps,
  SOFTMAXROWNORMALIZE_CODE,
} from "./softmaxRowNormalize";

describe("softmax-row-normalize (Softmax Row Normalizer)", () => {
  it("should have correct metadata", () => {
    expect(softmaxRowNormalize.id).toBe("softmax-row-normalize");
    expect(softmaxRowNormalize.isMlInfra).toBe(true);
    expect(softmaxRowNormalize.mlInfraLevel).toBe(7);
    expect(softmaxRowNormalize.mlInfraCategory).toBe("ml_attention_geometry");
    expect(softmaxRowNormalize.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps", () => {
    const steps = generateSoftmaxRowNormalizeSteps(DEFAULT_SOFTMAXROWNORMALIZE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].stepIndex).toBe(0);
    expect(softmaxRowNormalize.trivia?.lineExplanations).toBeDefined();
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = SOFTMAXROWNORMALIZE_CODE.trim().split("\n");
    const lineExplanations = softmaxRowNormalize.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
