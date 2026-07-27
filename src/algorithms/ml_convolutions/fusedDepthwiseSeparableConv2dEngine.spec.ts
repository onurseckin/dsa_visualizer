import { describe, it, expect } from "vitest";
import {
  fusedDepthwiseSeparableConv2dEngine,
  DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
  generateFusedDepthwiseSeparableConv2dEngineSteps,
} from "./fusedDepthwiseSeparableConv2dEngine";

describe("fusedDepthwiseSeparableConv2dEngine", () => {
  it("should have correct metadata", () => {
    expect(fusedDepthwiseSeparableConv2dEngine.id).toBe("fusedDepthwiseSeparableConv2dEngine");
    expect(fusedDepthwiseSeparableConv2dEngine.isMlInfra).toBe(true);
    expect(fusedDepthwiseSeparableConv2dEngine.mlInfraLevel).toBe(8);
    expect(fusedDepthwiseSeparableConv2dEngine.mlInfraCategory).toBe("ml_convolutions");
    expect(fusedDepthwiseSeparableConv2dEngine.categories).toContain("ml_convolutions");
    expect(fusedDepthwiseSeparableConv2dEngine.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFusedDepthwiseSeparableConv2dEngineSteps(
      DEFAULT_FUSEDDEPTHWISESEPARABLECONV2DENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Fused Depthwise Separable Conv2D Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
