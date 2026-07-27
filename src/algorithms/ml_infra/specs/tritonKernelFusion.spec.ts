import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRITON_FUSION_INPUT,
  TRITON_FUSION_EXAMPLES,
  TRITON_KERNEL_FUSION_CODE,
  generateTritonFusionSteps,
  tritonKernelFusion,
} from "../tritonKernelFusion";

describe("tritonKernelFusion (Level 8 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(tritonKernelFusion.id).toBe("triton-kernel-fusion");
    expect(tritonKernelFusion.isMlInfra).toBe(true);
    expect(tritonKernelFusion.mlInfraLevel).toBe(8);
    expect(tritonKernelFusion.category).toBe("ml_hardware_kernels");
    expect(tritonKernelFusion.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(TRITON_KERNEL_FUSION_CODE).toContain("def triton_fused_bias_gelu_kernel");
    expect(tritonKernelFusion.code).toBe(TRITON_KERNEL_FUSION_CODE);
    expect(tritonKernelFusion.defaultInput).toEqual(DEFAULT_TRITON_FUSION_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateTritonFusionSteps(DEFAULT_TRITON_FUSION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("array");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(TRITON_FUSION_EXAMPLES).toHaveLength(3);
    for (const example of TRITON_FUSION_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateTritonFusionSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
