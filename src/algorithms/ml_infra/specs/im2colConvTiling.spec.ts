import { describe, expect, it } from "vitest";
import {
  DEFAULT_IM2COL_INPUT,
  IM2COL_CONV_TILING_CODE,
  IM2COL_EXAMPLES,
  generateIm2colSteps,
  im2colConvTiling,
} from "../im2colConvTiling";

describe("im2colConvTiling (Level 6 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(im2colConvTiling.id).toBe("im2col-conv-tiling");
    expect(im2colConvTiling.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(im2colConvTiling.topicIds).toContain("ml_convolutions");
    expect(im2colConvTiling.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 6" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(IM2COL_CONV_TILING_CODE).toContain("def im2col_conv_tiling");
    expect(im2colConvTiling.code).toBe(IM2COL_CONV_TILING_CODE);
    expect(im2colConvTiling.defaultInput).toEqual(DEFAULT_IM2COL_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateIm2colSteps(DEFAULT_IM2COL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("matrix");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(IM2COL_EXAMPLES).toHaveLength(3);
    for (const example of IM2COL_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateIm2colSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
