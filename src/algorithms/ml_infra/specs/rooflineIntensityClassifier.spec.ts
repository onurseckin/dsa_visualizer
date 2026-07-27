import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOFLINE_INPUT,
  generateRooflineIntensityClassifierSteps,
  rooflineIntensityClassifier,
} from "../rooflineIntensityClassifier";

describe("rooflineIntensityClassifier algorithm definition", () => {
  it("has valid metadata and ML Infra markers", () => {
    expect(rooflineIntensityClassifier.id).toBe("roofline-intensity-classifier");
    expect(rooflineIntensityClassifier.category).toBe("ml_gemm_roofline");
    expect(rooflineIntensityClassifier.isMlInfra).toBe(true);
    expect(rooflineIntensityClassifier.mlInfraLevel).toBe(1);
    expect(rooflineIntensityClassifier.sources?.[0].type).toBe("ml_infra");
  });

  it("correctly classifies memory-bound low intensity kernel", () => {
    const steps = generateRooflineIntensityClassifierSteps(DEFAULT_ROOFLINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.bound).toBe("Memory-Bound");
  });

  it("correctly classifies compute-bound high intensity kernel", () => {
    const steps = generateRooflineIntensityClassifierSteps({
      flops: 1000000000000,
      bytesTransferred: 2000000000,
      peakTflops: 312,
      memoryBandwidthGbs: 2000,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.bound).toBe("Compute-Bound");
  });

  it("handles zero bytes transferred boundary condition", () => {
    const steps = generateRooflineIntensityClassifierSteps({
      flops: 1000000,
      bytesTransferred: 0,
      peakTflops: 312,
      memoryBandwidthGbs: 2000,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.bound).toBe("Memory-Bound");
    expect(lastStep.variables.attainable_tflops).toBe(0);
  });
});
