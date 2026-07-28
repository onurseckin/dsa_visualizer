import { describe, it, expect } from "vitest";
import { adjacentPairFrequencyCounter } from "./adjacentPairFrequencyCounter";

describe("adjacent-pair-frequency-counter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(adjacentPairFrequencyCounter.id).toBe("adjacent-pair-frequency-counter");
    expect(adjacentPairFrequencyCounter.topicIds).toContain("ml_tokenization");
    expect(adjacentPairFrequencyCounter.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(adjacentPairFrequencyCounter.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = adjacentPairFrequencyCounter.generateSteps(
      adjacentPairFrequencyCounter.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
