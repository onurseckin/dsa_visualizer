import { describe, it, expect } from "vitest";
import { characterFrequencyNgramCounter } from "./characterFrequencyNgramCounter";

describe("character-frequency-ngram-counter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(characterFrequencyNgramCounter.id).toBe("character-frequency-ngram-counter");
    expect(characterFrequencyNgramCounter.topicIds).toContain("ml_tokenization");
    expect(
      characterFrequencyNgramCounter.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(characterFrequencyNgramCounter.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = characterFrequencyNgramCounter.generateSteps(
      characterFrequencyNgramCounter.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
