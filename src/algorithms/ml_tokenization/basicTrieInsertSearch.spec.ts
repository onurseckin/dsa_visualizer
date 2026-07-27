import { describe, it, expect } from "vitest";
import { basicTrieInsertSearch } from "./basicTrieInsertSearch";

describe("basicTrieInsertSearch", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(basicTrieInsertSearch.id).toBe("basicTrieInsertSearch");
    expect(basicTrieInsertSearch.category).toBe("ml_tokenization");
    expect(basicTrieInsertSearch.isMlInfra).toBe(true);
    expect(basicTrieInsertSearch.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = basicTrieInsertSearch.generateSteps(basicTrieInsertSearch.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
