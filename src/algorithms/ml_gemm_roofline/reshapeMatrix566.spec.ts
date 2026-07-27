import { describe, it, expect } from "vitest";
import {
  reshapeMatrix566,
  DEFAULT_RESHAPEMATRIX566_INPUT,
  generateReshapeMatrix566Steps,
} from "./reshapeMatrix566";

describe("reshape-matrix-566 (Reshape Matrix Coordinates)", () => {
  it("should have correct metadata", () => {
    expect(reshapeMatrix566.id).toBe("reshape-matrix-566");
    expect(reshapeMatrix566.isMlInfra).toBe(true);
    expect(reshapeMatrix566.mlInfraLevel).toBe(2);
    expect(reshapeMatrix566.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(reshapeMatrix566.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateReshapeMatrix566Steps(DEFAULT_RESHAPEMATRIX566_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Reshape Matrix Coordinates");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
