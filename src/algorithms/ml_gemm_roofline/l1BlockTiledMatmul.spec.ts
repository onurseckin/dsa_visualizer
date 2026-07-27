import { describe, it, expect } from "vitest";
import { l1BlockTiledMatmul, DEFAULT_L1BLOCKTILEDMATMUL_INPUT, generateL1BlockTiledMatmulSteps } from "./l1BlockTiledMatmul";

describe("l1-block-tiled-matmul (L1 Cache Block-Tiled MatMul Engine)", () => {
  it("should have correct metadata", () => {
    expect(l1BlockTiledMatmul.id).toBe("l1-block-tiled-matmul");
    expect(l1BlockTiledMatmul.isMlInfra).toBe(true);
    expect(l1BlockTiledMatmul.mlInfraLevel).toBe(2);
    expect(l1BlockTiledMatmul.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(l1BlockTiledMatmul.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateL1BlockTiledMatmulSteps(DEFAULT_L1BLOCKTILEDMATMUL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("L1 Cache Block-Tiled MatMul Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
