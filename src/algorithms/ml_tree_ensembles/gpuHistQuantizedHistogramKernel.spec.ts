import { describe, it, expect } from "vitest";
import { gpuHistQuantizedHistogramKernel } from "./gpuHistQuantizedHistogramKernel";

describe("gpuHistQuantizedHistogramKernel", () => {
  it("should have valid metadata", () => {
    expect(gpuHistQuantizedHistogramKernel.id).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.title).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.code).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = gpuHistQuantizedHistogramKernel.generateSteps(
      gpuHistQuantizedHistogramKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
