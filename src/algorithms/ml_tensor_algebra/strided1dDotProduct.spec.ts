import { describe, it, expect } from "vitest";
import {
  strided1dDotProduct,
  DEFAULT_STRIDED1DDOTPRODUCT_INPUT,
  generateStrided1dDotProductSteps,
} from "./strided1dDotProduct";

describe("strided-1d-dot-product (Strided 1D Vector Dot Product)", () => {
  it("should have correct metadata", () => {
    expect(strided1dDotProduct.id).toBe("strided-1d-dot-product");
    expect(strided1dDotProduct.isMlInfra).toBe(true);
    expect(strided1dDotProduct.mlInfraLevel).toBe(1);
    expect(strided1dDotProduct.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(strided1dDotProduct.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateStrided1dDotProductSteps(DEFAULT_STRIDED1DDOTPRODUCT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Strided 1D Vector Dot Product");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
