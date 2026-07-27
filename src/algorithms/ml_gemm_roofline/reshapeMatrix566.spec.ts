import { describe, it, expect } from "vitest";
import {
  reshapeMatrix566,
  DEFAULT_RESHAPEMATRIX566_INPUT,
  generateReshapeMatrix566Steps,
  RESHAPEMATRIX566_CODE,
} from "./reshapeMatrix566";

describe("reshape-matrix-566 (Reshape Matrix Coordinates Engine)", () => {
  it("should have correct metadata", () => {
    expect(reshapeMatrix566.id).toBe("reshape-matrix-566");
    expect(reshapeMatrix566.isMlInfra).toBe(true);
    expect(reshapeMatrix566.mlInfraLevel).toBe(2);
    expect(reshapeMatrix566.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(reshapeMatrix566.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateReshapeMatrix566Steps(DEFAULT_RESHAPEMATRIX566_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Reshape Matrix Coordinates Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = RESHAPEMATRIX566_CODE.split("\n");
    const lineExplanations = reshapeMatrix566.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    if (!lineExplanations) return;

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(typeof lineExplanations[i]).toBe("string");
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
