import { describe, expect, it } from "vitest";
import {
  DEFAULT_TENSOR_CONTIGUITY_INPUT,
  generateTensorContiguityReshapeSteps,
  tensorContiguityReshape,
} from "../tensorContiguityReshape";

describe("tensorContiguityReshape algorithm definition", () => {
  it("has valid metadata and ML Infra markers", () => {
    expect(tensorContiguityReshape.id).toBe("tensor-contiguity-reshape");
    expect(tensorContiguityReshape.category).toBe("ml_tensor_algebra");
    expect(tensorContiguityReshape.isMlInfra).toBe(true);
    expect(tensorContiguityReshape.mlInfraLevel).toBe(1);
    expect(tensorContiguityReshape.sources?.[0].type).toBe("ml_infra");
  });

  it("handles basic contiguous zero-copy reshape correctly", () => {
    const steps = generateTensorContiguityReshapeSteps(DEFAULT_TENSOR_CONTIGUITY_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.can_zero_copy).toBe(true);
  });

  it("handles non-contiguous transposed tensor reshape", () => {
    const steps = generateTensorContiguityReshapeSteps({
      shape: [3, 4],
      strides: [1, 3],
      targetShape: [12],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.can_zero_copy).toBe(false);
  });

  it("handles element count mismatch error", () => {
    const steps = generateTensorContiguityReshapeSteps({
      shape: [2, 3],
      strides: [3, 1],
      targetShape: [5],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.can_zero_copy).toBe(false);
    expect(lastStep.explanation.what).toContain("Element Volume Mismatch");
  });
});
