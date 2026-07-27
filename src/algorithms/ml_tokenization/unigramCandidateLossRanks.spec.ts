import { describe, it, expect } from "vitest";
import { unigramCandidateLossRanks } from "./unigramCandidateLossRanks";

describe("unigramCandidateLossRanks", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(unigramCandidateLossRanks.id).toBe("unigramCandidateLossRanks");
    expect(unigramCandidateLossRanks.category).toBe("ml_tokenization");
    expect(unigramCandidateLossRanks.isMlInfra).toBe(true);
    expect(unigramCandidateLossRanks.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = unigramCandidateLossRanks.generateSteps(unigramCandidateLossRanks.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
