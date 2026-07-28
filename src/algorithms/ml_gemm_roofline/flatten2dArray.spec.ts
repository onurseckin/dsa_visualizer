import { describe, it, expect } from "vitest";
import {
  flatten2dArray,
  DEFAULT_FLATTEN2DARRAY_INPUT,
  generateFlatten2dArraySteps,
  FLATTEN2DARRAY_CODE,
} from "./flatten2dArray";
import { requireLineExplanations } from "../specs/assertions";

describe("flatten-2d-array (1D Buffer Matrix Flattening)", () => {
  it("should have correct metadata", () => {
    expect(flatten2dArray.id).toBe("flatten-2d-array");
    expect(flatten2dArray.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(flatten2dArray.topicIds).toContain("ml_gemm_roofline");
    expect(flatten2dArray.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateFlatten2dArraySteps(DEFAULT_FLATTEN2DARRAY_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("1D Buffer Matrix Linearization Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Matrix Linearization Complete");

    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = FLATTEN2DARRAY_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = requireLineExplanations(flatten2dArray);

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
