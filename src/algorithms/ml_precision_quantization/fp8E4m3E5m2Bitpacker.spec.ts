import { describe, it, expect } from "vitest";
import {
  fp8E4m3E5m2Bitpacker,
  generateFp8E4m3E5m2BitpackerSteps,
  DEFAULT_FP8E4M3E5M2BITPACKER_INPUT,
} from "./fp8E4m3E5m2Bitpacker";

describe("Fp8 E4m3 E5m2 Bitpacker", () => {
  it("should have correct metadata", () => {
    expect(fp8E4m3E5m2Bitpacker.id).toBe("fp8-e4m3-e5m2-bitpacker");
    expect(fp8E4m3E5m2Bitpacker.title).toBe("Fp8 E4m3 E5m2 Bitpacker");
    expect(fp8E4m3E5m2Bitpacker.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateFp8E4m3E5m2BitpackerSteps(DEFAULT_FP8E4M3E5M2BITPACKER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = fp8E4m3E5m2Bitpacker.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = fp8E4m3E5m2Bitpacker.code.split("\n");
    const lineExplanations = fp8E4m3E5m2Bitpacker.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fp8E4m3E5m2Bitpacker.examples?.length).toBe(3);
  });
});
