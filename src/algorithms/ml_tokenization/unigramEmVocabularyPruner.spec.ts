import { describe, it, expect } from "vitest";
import { unigramEmVocabularyPruner } from "./unigramEmVocabularyPruner";

describe("unigramEmVocabularyPruner", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(unigramEmVocabularyPruner.id).toBe("unigramEmVocabularyPruner");
    expect(unigramEmVocabularyPruner.category).toBe("ml_tokenization");
    expect(unigramEmVocabularyPruner.isMlInfra).toBe(true);
    expect(unigramEmVocabularyPruner.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = unigramEmVocabularyPruner.generateSteps(unigramEmVocabularyPruner.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
