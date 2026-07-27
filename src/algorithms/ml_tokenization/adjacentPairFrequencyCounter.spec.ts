import { describe, it, expect } from "vitest";
import { adjacentPairFrequencyCounter } from "./adjacentPairFrequencyCounter";

describe("adjacentPairFrequencyCounter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(adjacentPairFrequencyCounter.id).toBe("adjacentPairFrequencyCounter");
    expect(adjacentPairFrequencyCounter.category).toBe("ml_tokenization");
    expect(adjacentPairFrequencyCounter.isMlInfra).toBe(true);
    expect(adjacentPairFrequencyCounter.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = adjacentPairFrequencyCounter.generateSteps(
      adjacentPairFrequencyCounter.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
