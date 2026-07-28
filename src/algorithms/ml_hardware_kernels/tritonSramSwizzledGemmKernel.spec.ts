import { describe, it, expect } from "vitest";
import { tritonSramSwizzledGemmKernel } from "./tritonSramSwizzledGemmKernel";

describe("triton-sram-swizzled-gemm-kernel", () => {
  it("should have valid metadata", () => {
    expect(tritonSramSwizzledGemmKernel.id).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.title).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.code).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tritonSramSwizzledGemmKernel.generateSteps(
      tritonSramSwizzledGemmKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tritonSramSwizzledGemmKernel.code.trim().split("\n");
    const lineExplanations = tritonSramSwizzledGemmKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
