import { describe, it, expect } from "vitest";
import { iterativeBpeVocabularyTrainer } from "./iterativeBpeVocabularyTrainer";

describe("iterativeBpeVocabularyTrainer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(iterativeBpeVocabularyTrainer.id).toBe("iterativeBpeVocabularyTrainer");
    expect(iterativeBpeVocabularyTrainer.category).toBe("ml_tokenization");
    expect(iterativeBpeVocabularyTrainer.isMlInfra).toBe(true);
    expect(iterativeBpeVocabularyTrainer.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = iterativeBpeVocabularyTrainer.generateSteps(iterativeBpeVocabularyTrainer.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
