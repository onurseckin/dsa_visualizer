import { describe, it, expect } from "vitest";
import { iterativeBpeVocabularyTrainer } from "./iterativeBpeVocabularyTrainer";

describe("iterative-bpe-vocabulary-trainer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(iterativeBpeVocabularyTrainer.id).toBe("iterative-bpe-vocabulary-trainer");
    expect(iterativeBpeVocabularyTrainer.topicIds).toContain("ml_tokenization");
    expect(
      iterativeBpeVocabularyTrainer.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(iterativeBpeVocabularyTrainer.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = iterativeBpeVocabularyTrainer.generateSteps(
      iterativeBpeVocabularyTrainer.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
