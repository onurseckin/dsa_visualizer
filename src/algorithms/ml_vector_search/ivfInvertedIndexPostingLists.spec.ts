import { describe, it, expect } from "vitest";
import { ivfInvertedIndexPostingLists } from "./ivfInvertedIndexPostingLists";

describe("ivf-inverted-index-posting-lists", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(ivfInvertedIndexPostingLists).toBeDefined();
    expect(ivfInvertedIndexPostingLists.id).toBe("ivf-inverted-index-posting-lists");
    expect(ivfInvertedIndexPostingLists.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(ivfInvertedIndexPostingLists.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = ivfInvertedIndexPostingLists.generateSteps(
      ivfInvertedIndexPostingLists.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
