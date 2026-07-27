import { describe, it, expect } from "vitest";
import {
  softmaxRowNormalize,
  DEFAULT_SOFTMAXROWNORMALIZE_INPUT,
  generateSoftmaxRowNormalizeSteps,
} from "./softmaxRowNormalize";

describe("softmax-row-normalize (Softmax Row Normalizer)", () => {
  it("should have correct metadata", () => {
    expect(softmaxRowNormalize.id).toBe("softmax-row-normalize");
    expect(softmaxRowNormalize.isMlInfra).toBe(true);
    expect(softmaxRowNormalize.mlInfraLevel).toBe(7);
    expect(softmaxRowNormalize.mlInfraCategory).toBe("ml_attention_geometry");
    expect(softmaxRowNormalize.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSoftmaxRowNormalizeSteps(DEFAULT_SOFTMAXROWNORMALIZE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Softmax Row Normalizer");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
