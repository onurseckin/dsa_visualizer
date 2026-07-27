import { describe, it, expect } from "vitest";
import { gpuHistQuantizedHistogramKernel, DEFAULT_GPUHISTQUANTIZEDHISTOGRAMKERNEL_INPUT, generateGpuHistQuantizedHistogramKernelSteps } from "./gpuHistQuantizedHistogramKernel";

describe("gpu-hist-quantized-histogram-kernel (GPU `gpu_hist` Shared Memory Quantized Histogram Builder)", () => {
  it("should have correct metadata", () => {
    expect(gpuHistQuantizedHistogramKernel.id).toBe("gpu-hist-quantized-histogram-kernel");
    expect(gpuHistQuantizedHistogramKernel.isMlInfra).toBe(true);
    expect(gpuHistQuantizedHistogramKernel.mlInfraLevel).toBe(9);
    expect(gpuHistQuantizedHistogramKernel.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(gpuHistQuantizedHistogramKernel.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateGpuHistQuantizedHistogramKernelSteps(DEFAULT_GPUHISTQUANTIZEDHISTOGRAMKERNEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("GPU `gpu_hist` Shared Memory Quantized Histogram Builder");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
