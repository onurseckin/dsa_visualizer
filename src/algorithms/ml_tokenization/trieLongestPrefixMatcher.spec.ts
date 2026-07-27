import { describe, it, expect } from "vitest";
import { trieLongestPrefixMatcher } from "./trieLongestPrefixMatcher";

describe("trieLongestPrefixMatcher", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(trieLongestPrefixMatcher.id).toBe("trieLongestPrefixMatcher");
    expect(trieLongestPrefixMatcher.category).toBe("ml_tokenization");
    expect(trieLongestPrefixMatcher.isMlInfra).toBe(true);
    expect(trieLongestPrefixMatcher.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = trieLongestPrefixMatcher.generateSteps(trieLongestPrefixMatcher.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
