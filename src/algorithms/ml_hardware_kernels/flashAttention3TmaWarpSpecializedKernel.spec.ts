import { describe, it, expect } from "vitest";
import { flashAttention3TmaWarpSpecializedKernel } from "./flashAttention3TmaWarpSpecializedKernel";

describe("flash-attention-3-tma-warp-specialized-kernel", () => {
  it("should have valid metadata", () => {
    expect(flashAttention3TmaWarpSpecializedKernel.id).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.title).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.code).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = flashAttention3TmaWarpSpecializedKernel.generateSteps(
      flashAttention3TmaWarpSpecializedKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = flashAttention3TmaWarpSpecializedKernel.code.trim().split("\n");
    const lineExplanations = flashAttention3TmaWarpSpecializedKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
