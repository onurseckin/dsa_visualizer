import { describe, it, expect } from "vitest";
import { warpShuffleButterflyReduction, DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT, generateWarpShuffleButterflyReductionSteps } from "./warpShuffleButterflyReduction";

describe("warp-shuffle-butterfly-reduction (CUDA Warp Butterfly Reduction Primitive)", () => {
  it("should have correct metadata", () => {
    expect(warpShuffleButterflyReduction.id).toBe("warp-shuffle-butterfly-reduction");
    expect(warpShuffleButterflyReduction.isMlInfra).toBe(true);
    expect(warpShuffleButterflyReduction.mlInfraLevel).toBe(10);
    expect(warpShuffleButterflyReduction.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(warpShuffleButterflyReduction.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateWarpShuffleButterflyReductionSteps(DEFAULT_WARPSHUFFLEBUTTERFLYREDUCTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("CUDA Warp Butterfly Reduction Primitive");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
