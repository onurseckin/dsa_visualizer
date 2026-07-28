import { describe, it, expect } from "vitest";
import { basicTrieInsertSearch, DEFAULT_BASIC_TRIE_INPUT } from "./basicTrieInsertSearch";

describe("basic-trie-insert-search", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(basicTrieInsertSearch.id).toBe("basic-trie-insert-search");
    expect(basicTrieInsertSearch.topicIds).toContain("ml_tokenization");
    expect(basicTrieInsertSearch.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(basicTrieInsertSearch.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return steps with graph visual snapshot for defaultInput", () => {
    const steps = basicTrieInsertSearch.generateSteps(DEFAULT_BASIC_TRIE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
    expect(steps[0].primarySnapshot.kind).toBe("graph");

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState?.customState?.searchResult).toBe("True");
  });

  it("should handle prefix match where is_end_of_word is False ('appl')", () => {
    const steps = basicTrieInsertSearch.generateSteps({
      ...DEFAULT_BASIC_TRIE_INPUT,
      searchTarget: "appl",
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState?.customState?.searchResult).toBe("False");
    expect(lastStep.explanation.why).toContain("is_end_of_word = False");
  });

  it("should handle missing character path ('banana')", () => {
    const steps = basicTrieInsertSearch.generateSteps({
      ...DEFAULT_BASIC_TRIE_INPUT,
      searchTarget: "banana",
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState?.customState?.searchResult).toBe("False");
    expect(lastStep.explanation.what).toContain("return False");
  });
});
