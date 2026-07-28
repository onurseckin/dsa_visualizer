import { describe, it, expect } from "vitest";
import { tritonL2CacheSwizzledGemmScheduler } from "./tritonL2CacheSwizzledGemmScheduler";

describe("triton-l2-cache-swizzled-gemm-scheduler", () => {
  it("should have valid metadata", () => {
    expect(tritonL2CacheSwizzledGemmScheduler.id).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.title).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.code).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tritonL2CacheSwizzledGemmScheduler.generateSteps(
      tritonL2CacheSwizzledGemmScheduler.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tritonL2CacheSwizzledGemmScheduler.code.trim().split("\n");
    const lineExplanations = tritonL2CacheSwizzledGemmScheduler.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
