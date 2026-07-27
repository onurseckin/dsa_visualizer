import { describe, it, expect } from "vitest";
import { fakeQuantizedW8a8Matmul, DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT, generateFakeQuantizedW8a8MatmulSteps } from "./fakeQuantizedW8a8Matmul";

describe("fake-quantized-w8a8-matmul (Fake-Quantized W8A8 Matrix Multiplication)", () => {
  it("should have correct metadata", () => {
    expect(fakeQuantizedW8a8Matmul.id).toBe("fake-quantized-w8a8-matmul");
    expect(fakeQuantizedW8a8Matmul.isMlInfra).toBe(true);
    expect(fakeQuantizedW8a8Matmul.mlInfraLevel).toBe(4);
    expect(fakeQuantizedW8a8Matmul.mlInfraCategory).toBe("ml_precision_quantization");
    expect(fakeQuantizedW8a8Matmul.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFakeQuantizedW8a8MatmulSteps(DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Fake-Quantized W8A8 Matrix Multiplication");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
