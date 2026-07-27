import { describe, it, expect } from "vitest";
import { gpuHistQuantizedHistogramKernel } from "./gpuHistQuantizedHistogramKernel";

describe("gpuHistQuantizedHistogramKernel", () => {
  it("should have valid metadata", () => {
    expect(gpuHistQuantizedHistogramKernel.id).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.title).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.code).toBeDefined();
    expect(gpuHistQuantizedHistogramKernel.examples?.length).toBeGreaterThan(0);
    expect(gpuHistQuantizedHistogramKernel.description.length).toBeGreaterThan(200);
    expect(gpuHistQuantizedHistogramKernel.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = gpuHistQuantizedHistogramKernel.generateSteps(
      gpuHistQuantizedHistogramKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = gpuHistQuantizedHistogramKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = gpuHistQuantizedHistogramKernel.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
