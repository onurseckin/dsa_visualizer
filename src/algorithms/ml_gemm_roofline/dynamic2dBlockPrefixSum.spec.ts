import { describe, it, expect } from "vitest";
import {
  dynamic2dBlockPrefixSum,
  DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
  generateDynamic2dBlockPrefixSumSteps,
  DYNAMIC2DBLOCKPREFIXSUM_CODE,
} from "./dynamic2dBlockPrefixSum";

describe("dynamic-2d-block-prefix-sum (Block-Tiled 2D Prefix Sum Engine)", () => {
  it("should have correct metadata", () => {
    expect(dynamic2dBlockPrefixSum.id).toBe("dynamic-2d-block-prefix-sum");
    expect(dynamic2dBlockPrefixSum.isMlInfra).toBe(true);
    expect(dynamic2dBlockPrefixSum.mlInfraLevel).toBe(2);
    expect(dynamic2dBlockPrefixSum.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(dynamic2dBlockPrefixSum.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateDynamic2dBlockPrefixSumSteps(
      DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Block-Tiled 2D Prefix Sum Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("2D Prefix Sum Complete");

    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = DYNAMIC2DBLOCKPREFIXSUM_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = dynamic2dBlockPrefixSum.trivia.lineExplanations;

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
