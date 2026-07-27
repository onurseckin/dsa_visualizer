import { describe, it, expect } from "vitest";
import {
  conv1dSharedMemoryScratchpad,
  DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
  generateConv1dSharedMemoryScratchpadSteps,
  CONV1DSHAREDMEMORYSCRATCHPAD_CODE,
} from "./conv1dSharedMemoryScratchpad";

describe("conv1d-shared-memory-scratchpad (1D Conv GPU SRAM Scratchpad Simulator)", () => {
  it("should have correct metadata", () => {
    expect(conv1dSharedMemoryScratchpad.id).toBe("conv1d-shared-memory-scratchpad");
    expect(conv1dSharedMemoryScratchpad.isMlInfra).toBe(true);
    expect(conv1dSharedMemoryScratchpad.mlInfraLevel).toBe(2);
    expect(conv1dSharedMemoryScratchpad.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(conv1dSharedMemoryScratchpad.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateConv1dSharedMemoryScratchpadSteps(
      DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("1D Conv GPU SRAM Scratchpad Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("1D Convolution Execution Complete");

    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = CONV1DSHAREDMEMORYSCRATCHPAD_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = conv1dSharedMemoryScratchpad.trivia.lineExplanations;

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
