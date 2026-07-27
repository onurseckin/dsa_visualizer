import { describe, it, expect } from "vitest";
import {
  conv1dSharedMemoryScratchpad,
  DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
  generateConv1dSharedMemoryScratchpadSteps,
} from "./conv1dSharedMemoryScratchpad";

describe("conv1d-shared-memory-scratchpad (1D Conv GPU SRAM Scratchpad Simulator)", () => {
  it("should have correct metadata", () => {
    expect(conv1dSharedMemoryScratchpad.id).toBe("conv1d-shared-memory-scratchpad");
    expect(conv1dSharedMemoryScratchpad.isMlInfra).toBe(true);
    expect(conv1dSharedMemoryScratchpad.mlInfraLevel).toBe(2);
    expect(conv1dSharedMemoryScratchpad.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(conv1dSharedMemoryScratchpad.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateConv1dSharedMemoryScratchpadSteps(
      DEFAULT_CONV1DSHAREDMEMORYSCRATCHPAD_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("1D Conv GPU SRAM Scratchpad Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
