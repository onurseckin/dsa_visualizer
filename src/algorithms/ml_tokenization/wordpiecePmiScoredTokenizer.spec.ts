import { describe, it, expect } from "vitest";
import { wordpiecePmiScoredTokenizer } from "./wordpiecePmiScoredTokenizer";

describe("wordpiecePmiScoredTokenizer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(wordpiecePmiScoredTokenizer.id).toBe("wordpiecePmiScoredTokenizer");
    expect(wordpiecePmiScoredTokenizer.category).toBe("ml_tokenization");
    expect(wordpiecePmiScoredTokenizer.isMlInfra).toBe(true);
    expect(wordpiecePmiScoredTokenizer.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = wordpiecePmiScoredTokenizer.generateSteps(wordpiecePmiScoredTokenizer.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
