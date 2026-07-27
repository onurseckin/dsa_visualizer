import { describe, it, expect } from "vitest";
import { alignedSimtBlockTiling, DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT, generateAlignedSimtBlockTilingSteps } from "./alignedSimtBlockTiling";

describe("aligned-simt-block-tiling (SIMD/SIMT Aligned Memory Tiling Engine)", () => {
  it("should have correct metadata", () => {
    expect(alignedSimtBlockTiling.id).toBe("aligned-simt-block-tiling");
    expect(alignedSimtBlockTiling.isMlInfra).toBe(true);
    expect(alignedSimtBlockTiling.mlInfraLevel).toBe(1);
    expect(alignedSimtBlockTiling.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(alignedSimtBlockTiling.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAlignedSimtBlockTilingSteps(DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("SIMD/SIMT Aligned Memory Tiling Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
