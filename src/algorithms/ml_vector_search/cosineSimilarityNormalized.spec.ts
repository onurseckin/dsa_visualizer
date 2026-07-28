import { describe, it, expect } from "vitest";
import { cosineSimilarityNormalized } from "./cosineSimilarityNormalized";

describe("cosine-similarity-normalized", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(cosineSimilarityNormalized).toBeDefined();
    expect(cosineSimilarityNormalized.id).toBe("cosine-similarity-normalized");
    expect(cosineSimilarityNormalized.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(cosineSimilarityNormalized.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = cosineSimilarityNormalized.generateSteps(cosineSimilarityNormalized.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
