import { describe, it, expect } from "vitest";
import { fp8E4m3E5m2Bitpacker, DEFAULT_FP8E4M3E5M2BITPACKER_INPUT, generateFp8E4m3E5m2BitpackerSteps } from "./fp8E4m3E5m2Bitpacker";

describe("fp8-e4m3-e5m2-bitpacker (FP8 E4M3 vs E5M2 Bitwise Converter)", () => {
  it("should have correct metadata", () => {
    expect(fp8E4m3E5m2Bitpacker.id).toBe("fp8-e4m3-e5m2-bitpacker");
    expect(fp8E4m3E5m2Bitpacker.isMlInfra).toBe(true);
    expect(fp8E4m3E5m2Bitpacker.mlInfraLevel).toBe(4);
    expect(fp8E4m3E5m2Bitpacker.mlInfraCategory).toBe("ml_precision_quantization");
    expect(fp8E4m3E5m2Bitpacker.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFp8E4m3E5m2BitpackerSteps(DEFAULT_FP8E4M3E5M2BITPACKER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FP8 E4M3 vs E5M2 Bitwise Converter");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
