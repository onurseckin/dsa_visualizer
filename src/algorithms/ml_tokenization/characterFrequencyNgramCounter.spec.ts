import { describe, it, expect } from "vitest";
import { characterFrequencyNgramCounter } from "./characterFrequencyNgramCounter";

describe("characterFrequencyNgramCounter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(characterFrequencyNgramCounter.id).toBe("characterFrequencyNgramCounter");
    expect(characterFrequencyNgramCounter.category).toBe("ml_tokenization");
    expect(characterFrequencyNgramCounter.isMlInfra).toBe(true);
    expect(characterFrequencyNgramCounter.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = characterFrequencyNgramCounter.generateSteps(characterFrequencyNgramCounter.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
