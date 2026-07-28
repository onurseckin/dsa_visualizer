import { describe, it, expect } from "vitest";
import {
  stableSoftmaxLogsumexp,
  generateStableSoftmaxLogsumexpSteps,
  DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT,
} from "./stableSoftmaxLogsumexp";

describe("Stable Softmax Logsumexp", () => {
  it("should have correct metadata", () => {
    expect(stableSoftmaxLogsumexp.id).toBe("stable-softmax-logsumexp");
    expect(stableSoftmaxLogsumexp.title).toBe("Stable Softmax Logsumexp");
    expect(stableSoftmaxLogsumexp.topicIds).toContain("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateStableSoftmaxLogsumexpSteps(DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = stableSoftmaxLogsumexp.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = stableSoftmaxLogsumexp.code.split("\n");
    const lineExplanations = stableSoftmaxLogsumexp.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(stableSoftmaxLogsumexp.examples?.length).toBe(3);
  });
});
