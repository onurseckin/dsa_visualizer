import { describe, it, expect } from "vitest";
import { subvectorDecompositionCodebook } from "./subvectorDecompositionCodebook";

describe("subvector-decomposition-codebook", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(subvectorDecompositionCodebook).toBeDefined();
    expect(subvectorDecompositionCodebook.id).toBe("subvector-decomposition-codebook");
    expect(
      subvectorDecompositionCodebook.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(subvectorDecompositionCodebook.topicIds).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = subvectorDecompositionCodebook.generateSteps(
      subvectorDecompositionCodebook.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
