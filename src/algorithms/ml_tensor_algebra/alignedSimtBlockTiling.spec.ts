import { describe, it, expect } from "vitest";
import {
  alignedSimtBlockTiling,
  DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT,
  generateAlignedSimtBlockTilingSteps,
} from "./alignedSimtBlockTiling";

describe("aligned-simt-block-tiling (SIMD/SIMT Aligned Memory Tiling Engine)", () => {
  it("should have correct metadata", () => {
    expect(alignedSimtBlockTiling.id).toBe("aligned-simt-block-tiling");
    expect(alignedSimtBlockTiling.isMlInfra).toBe(true);
    expect(alignedSimtBlockTiling.mlInfraLevel).toBe(1);
    expect(alignedSimtBlockTiling.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(alignedSimtBlockTiling.categories).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateAlignedSimtBlockTilingSteps(DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("SIMD/SIMT Aligned Memory Tiling Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Tiled Blocks");
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = alignedSimtBlockTiling.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = alignedSimtBlockTiling.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });
});
