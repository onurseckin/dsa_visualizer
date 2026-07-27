import { describe, it, expect } from "vitest";
import { fp16OverflowRescalingEngine, DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT, generateFp16OverflowRescalingEngineSteps } from "./fp16OverflowRescalingEngine";

describe("fp16-overflow-rescaling-engine (FP16 Dynamic Loss Scaling Engine)", () => {
  it("should have correct metadata", () => {
    expect(fp16OverflowRescalingEngine.id).toBe("fp16-overflow-rescaling-engine");
    expect(fp16OverflowRescalingEngine.isMlInfra).toBe(true);
    expect(fp16OverflowRescalingEngine.mlInfraLevel).toBe(4);
    expect(fp16OverflowRescalingEngine.mlInfraCategory).toBe("ml_precision_quantization");
    expect(fp16OverflowRescalingEngine.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFp16OverflowRescalingEngineSteps(DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FP16 Dynamic Loss Scaling Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
