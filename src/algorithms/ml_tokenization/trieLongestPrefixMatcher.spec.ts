import { describe, it, expect } from "vitest";
import { trieLongestPrefixMatcher } from "./trieLongestPrefixMatcher";
import { requireExampleInputs } from "../specs/assertions";

describe("trie-longest-prefix-matcher", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(trieLongestPrefixMatcher.id).toBe("trie-longest-prefix-matcher");
    expect(trieLongestPrefixMatcher.topicIds).toContain("ml_tokenization");
    expect(trieLongestPrefixMatcher.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(trieLongestPrefixMatcher.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return steps with graph snapshot for defaultInput", () => {
    const steps = trieLongestPrefixMatcher.generateSteps(trieLongestPrefixMatcher.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
    expect(steps[0].primarySnapshot.kind).toBe("graph");
  });

  it("should generate steps without error for all examples", () => {
    for (const input of requireExampleInputs(
      trieLongestPrefixMatcher,
      (value): value is typeof trieLongestPrefixMatcher.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = trieLongestPrefixMatcher.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.explanation.what).toBeTruthy();
        expect(step.explanation.why).toBeTruthy();
        expect(step.primarySnapshot.kind).toBe("graph");
      }
    }
  });
});
