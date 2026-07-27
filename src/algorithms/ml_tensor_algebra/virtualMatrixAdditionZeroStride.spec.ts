import { describe, it, expect } from "vitest";
import {
  virtualMatrixAdditionZeroStride,
  DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
  generateVirtualMatrixAdditionZeroStrideSteps,
  VIRTUALMATRIXADDITIONZEROSTRIDE_CODE,
} from "./virtualMatrixAdditionZeroStride";

describe("virtual-matrix-addition-zero-stride (Zero-Stride Broadcasting Matrix Addition)", () => {
  it("should have correct metadata", () => {
    expect(virtualMatrixAdditionZeroStride.id).toBe("virtual-matrix-addition-zero-stride");
    expect(virtualMatrixAdditionZeroStride.isMlInfra).toBe(true);
    expect(virtualMatrixAdditionZeroStride.mlInfraLevel).toBe(1);
    expect(virtualMatrixAdditionZeroStride.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(virtualMatrixAdditionZeroStride.categories).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 steps with matrix primarySnapshot for default input", () => {
    const steps = generateVirtualMatrixAdditionZeroStrideSteps(
      DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("virtual_matrix_addition_zero_stride");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = VIRTUALMATRIXADDITIONZEROSTRIDE_CODE.trim().split("\n");
    const totalLines = codeLines.length;
    expect(totalLines).toBe(16);

    const lineExplanations = virtualMatrixAdditionZeroStride.trivia?.lineExplanations || {};
    for (let lineNum = 1; lineNum <= totalLines; lineNum++) {
      expect(lineExplanations[lineNum]).toBeDefined();
      expect(typeof lineExplanations[lineNum]).toBe("string");
      expect(lineExplanations[lineNum].length).toBeGreaterThan(0);
    }
  });
});
