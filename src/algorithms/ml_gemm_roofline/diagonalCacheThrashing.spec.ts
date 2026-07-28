import { describe, it, expect } from "vitest";
import {
  diagonalCacheThrashing,
  DEFAULT_DIAGONALCACHETHRASHING_INPUT,
  generateDiagonalCacheThrashingSteps,
  DIAGONALCACHETHRASHING_CODE,
} from "./diagonalCacheThrashing";
import { requireLineExplanations } from "../specs/assertions";

describe("diagonal-cache-thrashing (Diagonal Matrix Access Cache Thrashing)", () => {
  it("should have correct metadata", () => {
    expect(diagonalCacheThrashing.id).toBe("diagonal-cache-thrashing");
    expect(diagonalCacheThrashing.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(diagonalCacheThrashing.topicIds).toContain("ml_gemm_roofline");
    expect(diagonalCacheThrashing.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateDiagonalCacheThrashingSteps(DEFAULT_DIAGONALCACHETHRASHING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Diagonal Cache Thrashing Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Diagonal Access Simulation Complete");

    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = DIAGONALCACHETHRASHING_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = requireLineExplanations(diagonalCacheThrashing);

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
