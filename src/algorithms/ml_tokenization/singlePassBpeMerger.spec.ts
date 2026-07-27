import { describe, it, expect } from "vitest";
import { singlePassBpeMerger } from "./singlePassBpeMerger";

describe("singlePassBpeMerger", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(singlePassBpeMerger.id).toBe("singlePassBpeMerger");
    expect(singlePassBpeMerger.category).toBe("ml_tokenization");
    expect(singlePassBpeMerger.isMlInfra).toBe(true);
    expect(singlePassBpeMerger.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = singlePassBpeMerger.generateSteps(singlePassBpeMerger.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
