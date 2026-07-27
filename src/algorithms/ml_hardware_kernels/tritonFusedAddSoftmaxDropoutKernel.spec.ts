import { describe, it, expect } from "vitest";
import { tritonFusedAddSoftmaxDropoutKernel } from "./tritonFusedAddSoftmaxDropoutKernel";

describe("tritonFusedAddSoftmaxDropoutKernel", () => {
  it("should have valid metadata", () => {
    expect(tritonFusedAddSoftmaxDropoutKernel.id).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.title).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.code).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tritonFusedAddSoftmaxDropoutKernel.generateSteps(
      tritonFusedAddSoftmaxDropoutKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
