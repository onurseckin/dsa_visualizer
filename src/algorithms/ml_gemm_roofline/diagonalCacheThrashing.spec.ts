import { describe, it, expect } from "vitest";
import {
  diagonalCacheThrashing,
  DEFAULT_DIAGONALCACHETHRASHING_INPUT,
  generateDiagonalCacheThrashingSteps,
} from "./diagonalCacheThrashing";

describe("diagonal-cache-thrashing (Diagonal Matrix Access Cache Thrashing)", () => {
  it("should have correct metadata", () => {
    expect(diagonalCacheThrashing.id).toBe("diagonal-cache-thrashing");
    expect(diagonalCacheThrashing.isMlInfra).toBe(true);
    expect(diagonalCacheThrashing.mlInfraLevel).toBe(2);
    expect(diagonalCacheThrashing.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(diagonalCacheThrashing.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDiagonalCacheThrashingSteps(DEFAULT_DIAGONALCACHETHRASHING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Diagonal Matrix Access Cache Thrashing");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
