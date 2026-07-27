import { describe, it, expect } from "vitest";
import { antiDiagonalExtraction, DEFAULT_ANTIDIAGONALEXTRACTION_INPUT, generateAntiDiagonalExtractionSteps } from "./antiDiagonalExtraction";

describe("anti-diagonal-extraction (Anti-Diagonal Matrix Traversal)", () => {
  it("should have correct metadata", () => {
    expect(antiDiagonalExtraction.id).toBe("anti-diagonal-extraction");
    expect(antiDiagonalExtraction.isMlInfra).toBe(true);
    expect(antiDiagonalExtraction.mlInfraLevel).toBe(1);
    expect(antiDiagonalExtraction.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(antiDiagonalExtraction.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAntiDiagonalExtractionSteps(DEFAULT_ANTIDIAGONALEXTRACTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Anti-Diagonal Matrix Traversal");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
