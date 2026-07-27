import { describe, it, expect } from "vitest";
import {
  stableSoftmaxLogsumexp,
  generateStableSoftmaxLogsumexpSteps,
  DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT,
} from "./stableSoftmaxLogsumexp";

describe("Stable Softmax Logsumexp", () => {
  it("should have correct metadata", () => {
    expect(stableSoftmaxLogsumexp.id).toBeDefined();
    expect(stableSoftmaxLogsumexp.title).toBe("Stable Softmax Logsumexp");
    expect(stableSoftmaxLogsumexp.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateStableSoftmaxLogsumexpSteps(DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(stableSoftmaxLogsumexp.examples?.length).toBe(3);
  });
});
