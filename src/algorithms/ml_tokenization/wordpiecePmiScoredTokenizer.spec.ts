import { describe, it, expect } from "vitest";
import { wordpiecePmiScoredTokenizer } from "./wordpiecePmiScoredTokenizer";

describe("wordpiece-pmi-scored-tokenizer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(wordpiecePmiScoredTokenizer.id).toBe("wordpiece-pmi-scored-tokenizer");
    expect(wordpiecePmiScoredTokenizer.topicIds).toContain("ml_tokenization");
    expect(wordpiecePmiScoredTokenizer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(wordpiecePmiScoredTokenizer.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = wordpiecePmiScoredTokenizer.generateSteps(
      wordpiecePmiScoredTokenizer.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
