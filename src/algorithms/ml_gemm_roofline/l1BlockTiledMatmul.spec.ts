import { describe, it, expect } from "vitest";
import {
  l1BlockTiledMatmul,
  DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
  generateL1BlockTiledMatmulSteps,
  L1BLOCKTILEDMATMUL_CODE,
} from "./l1BlockTiledMatmul";

describe("l1-block-tiled-matmul (L1 Cache Block-Tiled MatMul Engine)", () => {
  it("should have correct metadata", () => {
    expect(l1BlockTiledMatmul.id).toBe("l1-block-tiled-matmul");
    expect(l1BlockTiledMatmul.isMlInfra).toBe(true);
    expect(l1BlockTiledMatmul.mlInfraLevel).toBe(2);
    expect(l1BlockTiledMatmul.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(l1BlockTiledMatmul.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateL1BlockTiledMatmulSteps(DEFAULT_L1BLOCKTILEDMATMUL_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("L1 Cache Block-Tiled MatMul Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = L1BLOCKTILEDMATMUL_CODE.split("\n");
    const trivia = l1BlockTiledMatmul.trivia;
    expect(trivia).toBeDefined();
    if (!trivia) return;

    for (let i = 1; i <= codeLines.length; i++) {
      expect(trivia.lineExplanations[i]).toBeDefined();
      expect(typeof trivia.lineExplanations[i]).toBe("string");
      expect(trivia.lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
