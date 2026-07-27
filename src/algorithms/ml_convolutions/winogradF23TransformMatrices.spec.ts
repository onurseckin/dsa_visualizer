import { describe, it, expect } from "vitest";
import {
  winogradF23TransformMatrices,
  DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
  generateWinogradF23TransformMatricesSteps,
} from "./winogradF23TransformMatrices";

describe("winogradF23TransformMatrices", () => {
  it("should have correct metadata", () => {
    expect(winogradF23TransformMatrices.id).toBe("winogradF23TransformMatrices");
    expect(winogradF23TransformMatrices.isMlInfra).toBe(true);
    expect(winogradF23TransformMatrices.mlInfraLevel).toBe(8);
    expect(winogradF23TransformMatrices.mlInfraCategory).toBe("ml_convolutions");
    expect(winogradF23TransformMatrices.categories).toContain("ml_convolutions");
    expect(winogradF23TransformMatrices.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateWinogradF23TransformMatricesSteps(
      DEFAULT_WINOGRADF23TRANSFORMMATRICES_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Winograd F(2x2, 3x3) Transform Matrices");
    expect(steps[steps.length - 1].explanation.what).toContain("Inverse Spatial Transform");
  });
});
