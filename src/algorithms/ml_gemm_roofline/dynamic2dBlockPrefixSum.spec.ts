import { describe, it, expect } from "vitest";
import { dynamic2dBlockPrefixSum, DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT, generateDynamic2dBlockPrefixSumSteps } from "./dynamic2dBlockPrefixSum";

describe("dynamic-2d-block-prefix-sum (Block-Tiled 2D Prefix Sum Engine)", () => {
  it("should have correct metadata", () => {
    expect(dynamic2dBlockPrefixSum.id).toBe("dynamic-2d-block-prefix-sum");
    expect(dynamic2dBlockPrefixSum.isMlInfra).toBe(true);
    expect(dynamic2dBlockPrefixSum.mlInfraLevel).toBe(2);
    expect(dynamic2dBlockPrefixSum.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(dynamic2dBlockPrefixSum.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDynamic2dBlockPrefixSumSteps(DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Block-Tiled 2D Prefix Sum Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
