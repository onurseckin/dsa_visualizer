import { describe, it, expect } from "vitest";
import { byteLevelBpeTiktokenTokenizer } from "./byteLevelBpeTiktokenTokenizer";

describe("byteLevelBpeTiktokenTokenizer", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(byteLevelBpeTiktokenTokenizer.id).toBe("byteLevelBpeTiktokenTokenizer");
    expect(byteLevelBpeTiktokenTokenizer.category).toBe("ml_tokenization");
    expect(byteLevelBpeTiktokenTokenizer.isMlInfra).toBe(true);
    expect(byteLevelBpeTiktokenTokenizer.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = byteLevelBpeTiktokenTokenizer.generateSteps(byteLevelBpeTiktokenTokenizer.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
