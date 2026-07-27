import { describe, it, expect } from "vitest";
import {
  twoGpuParameterSplitter,
  DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT,
  generateTwoGpuParameterSplitterSteps,
} from "./twoGpuParameterSplitter";

describe("two-gpu-parameter-splitter (2-GPU Model Layer Pipeline Splitter)", () => {
  it("should have correct metadata", () => {
    expect(twoGpuParameterSplitter.id).toBe("two-gpu-parameter-splitter");
    expect(twoGpuParameterSplitter.isMlInfra).toBe(true);
    expect(twoGpuParameterSplitter.mlInfraLevel).toBe(11);
    expect(twoGpuParameterSplitter.mlInfraCategory).toBe("ml_distributed_systems");
    expect(twoGpuParameterSplitter.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTwoGpuParameterSplitterSteps(DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("2-GPU Model Layer Pipeline Splitter");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
