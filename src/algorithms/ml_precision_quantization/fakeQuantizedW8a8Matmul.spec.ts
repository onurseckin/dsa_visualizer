import { describe, it, expect } from "vitest";
import {
  fakeQuantizedW8a8Matmul,
  generateFakeQuantizedW8a8MatmulSteps,
  DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT,
} from "./fakeQuantizedW8a8Matmul";

describe("Fake Quantized W8a8 Matmul", () => {
  it("should have correct metadata", () => {
    expect(fakeQuantizedW8a8Matmul.id).toBeDefined();
    expect(fakeQuantizedW8a8Matmul.title).toBe("Fake Quantized W8a8 Matmul");
    expect(fakeQuantizedW8a8Matmul.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateFakeQuantizedW8a8MatmulSteps(DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fakeQuantizedW8a8Matmul.examples?.length).toBe(3);
  });
});
