import { describe, it, expect } from "vitest";
import { ahoCorasickMultiTokenMatcher } from "./ahoCorasickMultiTokenMatcher";
import { requireExampleInputs } from "../specs/assertions";

describe("aho-corasick-multi-token-matcher", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(ahoCorasickMultiTokenMatcher.id).toBe("aho-corasick-multi-token-matcher");
    expect(ahoCorasickMultiTokenMatcher.topicIds).toContain("ml_tokenization");
    expect(ahoCorasickMultiTokenMatcher.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(ahoCorasickMultiTokenMatcher.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return steps with graph snapshots for defaultInput", () => {
    const steps = ahoCorasickMultiTokenMatcher.generateSteps(
      ahoCorasickMultiTokenMatcher.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(steps[i].primarySnapshot.kind).toBe("graph");
      expect(steps[i].codeLine).toBeGreaterThanOrEqual(1);
      expect(steps[i].codeLine).toBeLessThanOrEqual(39);
    }
  });

  it("generateSteps should execute cleanly for all examples in definition", () => {
    for (const input of requireExampleInputs(
      ahoCorasickMultiTokenMatcher,
      (value): value is typeof ahoCorasickMultiTokenMatcher.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = ahoCorasickMultiTokenMatcher.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);

      const lastStep = steps[steps.length - 1];
      expect(lastStep.explanation.what).toContain("Complete");
      expect(lastStep.primarySnapshot.kind).toBe("graph");
    }
  });
});
