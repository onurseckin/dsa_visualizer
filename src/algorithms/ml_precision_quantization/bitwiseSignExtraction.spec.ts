import { describe, it, expect } from "vitest";
import { bitwiseSignExtraction, DEFAULT_BITWISESIGNEXTRACTION_INPUT, generateBitwiseSignExtractionSteps } from "./bitwiseSignExtraction";

describe("bitwise-sign-extraction (Bitwise Sign Bit Extraction)", () => {
  it("should have correct metadata", () => {
    expect(bitwiseSignExtraction.id).toBe("bitwise-sign-extraction");
    expect(bitwiseSignExtraction.isMlInfra).toBe(true);
    expect(bitwiseSignExtraction.mlInfraLevel).toBe(4);
    expect(bitwiseSignExtraction.mlInfraCategory).toBe("ml_precision_quantization");
    expect(bitwiseSignExtraction.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateBitwiseSignExtractionSteps(DEFAULT_BITWISESIGNEXTRACTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Bitwise Sign Bit Extraction");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
