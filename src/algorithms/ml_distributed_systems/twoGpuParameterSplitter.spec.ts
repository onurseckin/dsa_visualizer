import { describe, it, expect } from "vitest";
import {
  twoGpuParameterSplitter,
  DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT,
  generateTwoGpuParameterSplitterSteps,
} from "./twoGpuParameterSplitter";

describe("two-gpu-parameter-splitter (2-GPU Model Layer Pipeline Splitter)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(twoGpuParameterSplitter.id).toBe("two-gpu-parameter-splitter");
    expect(twoGpuParameterSplitter.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(twoGpuParameterSplitter.topicIds).toContain("ml_distributed_systems");
    expect(twoGpuParameterSplitter.topicIds).toContain("ml_distributed_systems");
    expect(twoGpuParameterSplitter.defaultInput).toEqual(DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT);

    const codeLines = twoGpuParameterSplitter.code.trim().split("\n").length;
    const explanationKeys = Object.keys(twoGpuParameterSplitter.trivia?.lineExplanations || {}).map(
      Number,
    );
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(twoGpuParameterSplitter.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate a semantic return step", () => {
    const steps = generateTwoGpuParameterSplitterSteps(DEFAULT_TWOGPUPARAMETERSPLITTER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("2-GPU Model Layer Pipeline Splitter");
    expect(steps[steps.length - 1].explanation.what).toBe("Return (gpu0_params, gpu1_params)");
    expect(steps[steps.length - 1].codeLine).toBe(
      twoGpuParameterSplitter.code.trim().split("\n").length,
    );
  });
});
