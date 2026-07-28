import { describe, it, expect } from "vitest";
import {
  fp16OverflowRescalingEngine,
  generateFp16OverflowRescalingEngineSteps,
  DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
} from "./fp16OverflowRescalingEngine";

describe("Fp16 Overflow Rescaling Engine", () => {
  it("should have correct metadata", () => {
    expect(fp16OverflowRescalingEngine.id).toBe("fp16-overflow-rescaling-engine");
    expect(fp16OverflowRescalingEngine.title).toBe("Fp16 Overflow Rescaling Engine");
    expect(fp16OverflowRescalingEngine.topicIds).toContain("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateFp16OverflowRescalingEngineSteps(
      DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = fp16OverflowRescalingEngine.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = fp16OverflowRescalingEngine.code.split("\n");
    const lineExplanations = fp16OverflowRescalingEngine.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(fp16OverflowRescalingEngine.examples?.length).toBe(3);
  });
});
