import { describe, it, expect } from "vitest";
import { ivfInvertedIndexPostingLists } from "./ivfInvertedIndexPostingLists";

describe("ivfInvertedIndexPostingLists", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(ivfInvertedIndexPostingLists).toBeDefined();
    expect(ivfInvertedIndexPostingLists.id).toBe("ivfInvertedIndexPostingLists");
    expect(ivfInvertedIndexPostingLists.isMlInfra).toBe(true);
    expect(ivfInvertedIndexPostingLists.mlInfraLevel).toBe(5);
    expect(ivfInvertedIndexPostingLists.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = ivfInvertedIndexPostingLists.generateSteps(ivfInvertedIndexPostingLists.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
