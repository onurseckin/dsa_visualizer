import { describe, it, expect } from "vitest";
import { ahoCorasickMultiTokenMatcher } from "./ahoCorasickMultiTokenMatcher";

describe("ahoCorasickMultiTokenMatcher", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(ahoCorasickMultiTokenMatcher.id).toBe("ahoCorasickMultiTokenMatcher");
    expect(ahoCorasickMultiTokenMatcher.category).toBe("ml_tokenization");
    expect(ahoCorasickMultiTokenMatcher.isMlInfra).toBe(true);
    expect(ahoCorasickMultiTokenMatcher.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = ahoCorasickMultiTokenMatcher.generateSteps(ahoCorasickMultiTokenMatcher.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
