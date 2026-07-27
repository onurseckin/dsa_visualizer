import { describe, expect, it } from "vitest";
import {
  DEFAULT_STRIDED_INDEX_ARITHMETIC_INPUT,
  STRIDED_INDEX_ARITHMETIC_CODE,
  generateStridedIndexArithmeticSteps,
  stridedIndexArithmetic,
} from "../stridedIndexArithmetic";

describe("stridedIndexArithmetic algorithm spec", () => {
  it("should have correct ML Infra Level 1 metadata", () => {
    expect(stridedIndexArithmetic.id).toBe("strided-index-arithmetic");
    expect(stridedIndexArithmetic.isMlInfra).toBe(true);
    expect(stridedIndexArithmetic.mlInfraLevel).toBe(1);
    expect(stridedIndexArithmetic.category).toBe("ml_tensor_algebra");
    expect(stridedIndexArithmetic.defaultInput).toEqual(DEFAULT_STRIDED_INDEX_ARITHMETIC_INPUT);
    expect(stridedIndexArithmetic.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should compute correct linear memory offset", () => {
    const steps = generateStridedIndexArithmeticSteps(DEFAULT_STRIDED_INDEX_ARITHMETIC_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.offset).toBe(18);
    expect(lastStep.variables.complete).toBe(true);
  });

  it("should return -1 for out-of-bounds index", () => {
    const oobInput = {
      shape: [2, 3, 4],
      strides: [12, 4, 1],
      indices: [2, 0, 0],
    };
    const steps = generateStridedIndexArithmeticSteps(oobInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.offset).toBe(-1);
  });

  it("should handle mismatched length inputs", () => {
    const steps = generateStridedIndexArithmeticSteps({
      shape: [2, 3],
      strides: [3, 1],
      indices: [1],
    });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.offset).toBe(-1);
  });
});

describe("stridedIndexArithmetic trivia metadata", () => {
  const meta = stridedIndexArithmetic.trivia;
  const lines = STRIDED_INDEX_ARITHMETIC_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
