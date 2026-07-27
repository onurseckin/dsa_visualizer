import { describe, it, expect } from "vitest";
import {
  vectorDotProductMac,
  DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
  generateVectorDotProductMacSteps,
} from "./vectorDotProductMac";

describe("vector-dot-product-mac (Vector Multiply-Accumulate (MAC))", () => {
  it("should have correct metadata", () => {
    expect(vectorDotProductMac.id).toBe("vector-dot-product-mac");
    expect(vectorDotProductMac.isMlInfra).toBe(true);
    expect(vectorDotProductMac.mlInfraLevel).toBe(2);
    expect(vectorDotProductMac.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(vectorDotProductMac.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVectorDotProductMacSteps(DEFAULT_VECTORDOTPRODUCTMAC_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Vector Multiply-Accumulate (MAC)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
