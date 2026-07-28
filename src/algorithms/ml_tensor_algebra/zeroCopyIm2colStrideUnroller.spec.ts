import { describe, it, expect } from "vitest";
import {
  zeroCopyIm2colStrideUnroller,
  DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
  generateZeroCopyIm2colStrideUnrollerSteps,
  ZEROCOPYIM2COLSTRIDEUNROLLER_CODE,
} from "./zeroCopyIm2colStrideUnroller";

describe("zero-copy-im2col-stride-unroller (Zero-Copy im2col Stride Receptive Field Unroller)", () => {
  it("should have correct metadata", () => {
    expect(zeroCopyIm2colStrideUnroller.id).toBe("zero-copy-im2col-stride-unroller");
    expect(zeroCopyIm2colStrideUnroller.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(zeroCopyIm2colStrideUnroller.topicIds).toContain("ml_tensor_algebra");
    expect(zeroCopyIm2colStrideUnroller.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 steps with matrix primarySnapshot for default input", () => {
    const steps = generateZeroCopyIm2colStrideUnrollerSteps(
      DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("zero_copy_im2col_stride_unroller");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = ZEROCOPYIM2COLSTRIDEUNROLLER_CODE.trim().split("\n");
    const totalLines = codeLines.length;
    expect(totalLines).toBe(17);

    const lineExplanations = zeroCopyIm2colStrideUnroller.trivia?.lineExplanations || {};
    for (let lineNum = 1; lineNum <= totalLines; lineNum++) {
      expect(lineExplanations[lineNum]).toBeDefined();
      expect(typeof lineExplanations[lineNum]).toBe("string");
      expect(lineExplanations[lineNum].length).toBeGreaterThan(0);
    }
  });
});
