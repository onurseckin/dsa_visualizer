import { describe, it, expect } from "vitest";
import { tritonSramSwizzledGemmKernel } from "./tritonSramSwizzledGemmKernel";

describe("tritonSramSwizzledGemmKernel", () => {
  it("should have valid metadata", () => {
    expect(tritonSramSwizzledGemmKernel.id).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.title).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.code).toBeDefined();
    expect(tritonSramSwizzledGemmKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tritonSramSwizzledGemmKernel.generateSteps(
      tritonSramSwizzledGemmKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
