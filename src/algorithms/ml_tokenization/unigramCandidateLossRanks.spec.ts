import { describe, it, expect } from "vitest";
import { unigramCandidateLossRanks } from "./unigramCandidateLossRanks";

describe("unigram-candidate-loss-ranks", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(unigramCandidateLossRanks.id).toBe("unigram-candidate-loss-ranks");
    expect(unigramCandidateLossRanks.topicIds).toContain("ml_tokenization");
    expect(unigramCandidateLossRanks.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(unigramCandidateLossRanks.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return valid steps without runtime errors", () => {
    const steps = unigramCandidateLossRanks.generateSteps(unigramCandidateLossRanks.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    const codeLines = unigramCandidateLossRanks.code.split("\n");
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThan(0);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
      expect(codeLines[step.codeLine - 1].trim().length).toBeGreaterThan(0);

      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe("array");

      if (step.primarySnapshot.kind === "array") {
        for (const el of step.primarySnapshot.elements) {
          expect(Number.isNaN(el.value)).toBe(false);
          expect(el.label).toBeDefined();
        }
      }
    }
  });

  it("should handle custom inputs accurately", () => {
    const customInput = {
      corpus: ["testing"],
      vocab: { test: 0.8, ing: 0.2, testing: 0.1 },
      candidatesToEvaluate: ["testing"],
    };
    const steps = unigramCandidateLossRanks.generateSteps(customInput);
    expect(steps.length).toBeGreaterThan(0);
  });
});
