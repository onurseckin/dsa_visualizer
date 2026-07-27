import { describe, it, expect } from "vitest";
import { stableSoftmaxLogsumexp, DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT, generateStableSoftmaxLogsumexpSteps } from "./stableSoftmaxLogsumexp";

describe("stable-softmax-logsumexp (Numerically Stable Softmax & LogSumExp)", () => {
  it("should have correct metadata", () => {
    expect(stableSoftmaxLogsumexp.id).toBe("stable-softmax-logsumexp");
    expect(stableSoftmaxLogsumexp.isMlInfra).toBe(true);
    expect(stableSoftmaxLogsumexp.mlInfraLevel).toBe(4);
    expect(stableSoftmaxLogsumexp.mlInfraCategory).toBe("ml_precision_quantization");
    expect(stableSoftmaxLogsumexp.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateStableSoftmaxLogsumexpSteps(DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Numerically Stable Softmax & LogSumExp");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
