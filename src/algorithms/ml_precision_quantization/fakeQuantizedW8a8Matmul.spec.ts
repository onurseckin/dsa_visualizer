import { describe, it, expect } from "vitest";
import {
  fakeQuantizedW8a8Matmul,
  generateFakeQuantizedW8a8MatmulSteps,
  DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT,
} from "./fakeQuantizedW8a8Matmul";

describe("Fake Quantized W8a8 Matmul", () => {
  it("should have correct metadata", () => {
    expect(fakeQuantizedW8a8Matmul.id).toBe("fake-quantized-w8a8-matmul");
    expect(fakeQuantizedW8a8Matmul.title).toBe("Fake Quantized W8a8 Matmul");
    expect(fakeQuantizedW8a8Matmul.topicIds).toContain("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateFakeQuantizedW8a8MatmulSteps(DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = fakeQuantizedW8a8Matmul.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = fakeQuantizedW8a8Matmul.code.split("\n");
    const lineExplanations = fakeQuantizedW8a8Matmul.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fakeQuantizedW8a8Matmul.examples?.length).toBe(3);
  });
});
