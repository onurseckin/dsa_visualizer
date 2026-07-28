import { describe, it, expect } from "vitest";
import { unigramEmVocabularyPruner } from "./unigramEmVocabularyPruner";
import { requireExampleInputs } from "../specs/assertions";

describe("unigram-em-vocabulary-pruner", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(unigramEmVocabularyPruner.id).toBe("unigram-em-vocabulary-pruner");
    expect(unigramEmVocabularyPruner.topicIds).toContain("ml_tokenization");
    expect(unigramEmVocabularyPruner.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(unigramEmVocabularyPruner.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = unigramEmVocabularyPruner.generateSteps(unigramEmVocabularyPruner.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });

  it("should execute generateSteps for all examples without runtime errors", () => {
    for (const input of requireExampleInputs(
      unigramEmVocabularyPruner,
      (value): value is typeof unigramEmVocabularyPruner.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = unigramEmVocabularyPruner.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.primarySnapshot.kind).toBe("array");
        expect(step.explanation.what).toBeDefined();
        expect(step.explanation.why).toBeDefined();
        if (step.primarySnapshot.kind === "array") {
          for (const el of step.primarySnapshot.elements) {
            expect(Number.isNaN(Number(el.value))).toBe(false);
          }
        }
      }
    }
  });
});
