import { describe, it, expect } from "vitest";
import { cosineSimilarityNormalized } from "./cosineSimilarityNormalized";

describe("cosineSimilarityNormalized", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(cosineSimilarityNormalized).toBeDefined();
    expect(cosineSimilarityNormalized.id).toBe("cosineSimilarityNormalized");
    expect(cosineSimilarityNormalized.isMlInfra).toBe(true);
    expect(cosineSimilarityNormalized.mlInfraLevel).toBe(5);
    expect(cosineSimilarityNormalized.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = cosineSimilarityNormalized.generateSteps(cosineSimilarityNormalized.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
