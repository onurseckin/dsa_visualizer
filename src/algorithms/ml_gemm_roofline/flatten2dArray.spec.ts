import { describe, it, expect } from "vitest";
import {
  flatten2dArray,
  DEFAULT_FLATTEN2DARRAY_INPUT,
  generateFlatten2dArraySteps,
} from "./flatten2dArray";

describe("flatten-2d-array (1D Buffer Matrix Flattening)", () => {
  it("should have correct metadata", () => {
    expect(flatten2dArray.id).toBe("flatten-2d-array");
    expect(flatten2dArray.isMlInfra).toBe(true);
    expect(flatten2dArray.mlInfraLevel).toBe(2);
    expect(flatten2dArray.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(flatten2dArray.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlatten2dArraySteps(DEFAULT_FLATTEN2DARRAY_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("1D Buffer Matrix Flattening");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
