import { describe, it, expect } from "vitest";
import {
  fp8E4m3E5m2Bitpacker,
  generateFp8E4m3E5m2BitpackerSteps,
  DEFAULT_FP8E4M3E5M2BITPACKER_INPUT,
} from "./fp8E4m3E5m2Bitpacker";

describe("Fp8 E4m3 E5m2 Bitpacker", () => {
  it("should have correct metadata", () => {
    expect(fp8E4m3E5m2Bitpacker.id).toBeDefined();
    expect(fp8E4m3E5m2Bitpacker.title).toBe("Fp8 E4m3 E5m2 Bitpacker");
    expect(fp8E4m3E5m2Bitpacker.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateFp8E4m3E5m2BitpackerSteps(DEFAULT_FP8E4M3E5M2BITPACKER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fp8E4m3E5m2Bitpacker.examples?.length).toBe(3);
  });
});
