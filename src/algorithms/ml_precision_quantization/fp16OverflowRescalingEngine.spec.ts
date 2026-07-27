import { describe, it, expect } from "vitest";
import {
  fp16OverflowRescalingEngine,
  generateFp16OverflowRescalingEngineSteps,
  DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
} from "./fp16OverflowRescalingEngine";

describe("Fp16 Overflow Rescaling Engine", () => {
  it("should have correct metadata", () => {
    expect(fp16OverflowRescalingEngine.id).toBeDefined();
    expect(fp16OverflowRescalingEngine.title).toBe("Fp16 Overflow Rescaling Engine");
    expect(fp16OverflowRescalingEngine.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateFp16OverflowRescalingEngineSteps(
      DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fp16OverflowRescalingEngine.examples?.length).toBe(3);
  });
});
