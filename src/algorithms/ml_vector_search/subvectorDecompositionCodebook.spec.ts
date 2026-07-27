import { describe, it, expect } from "vitest";
import { subvectorDecompositionCodebook } from "./subvectorDecompositionCodebook";

describe("subvectorDecompositionCodebook", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(subvectorDecompositionCodebook).toBeDefined();
    expect(subvectorDecompositionCodebook.id).toBe("subvectorDecompositionCodebook");
    expect(subvectorDecompositionCodebook.isMlInfra).toBe(true);
    expect(subvectorDecompositionCodebook.mlInfraLevel).toBe(5);
    expect(subvectorDecompositionCodebook.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = subvectorDecompositionCodebook.generateSteps(
      subvectorDecompositionCodebook.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
