import { describe, it, expect } from "vitest";
import {
  bitwiseSignExtraction,
  generateBitwiseSignExtractionSteps,
  DEFAULT_BITWISESIGNEXTRACTION_INPUT,
} from "./bitwiseSignExtraction";

describe("Bitwise Sign Extraction", () => {
  it("should have correct metadata", () => {
    expect(bitwiseSignExtraction.id).toBeDefined();
    expect(bitwiseSignExtraction.title).toBe("Bitwise Sign Extraction");
    expect(bitwiseSignExtraction.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateBitwiseSignExtractionSteps(DEFAULT_BITWISESIGNEXTRACTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(bitwiseSignExtraction.examples?.length).toBe(3);
  });
});
