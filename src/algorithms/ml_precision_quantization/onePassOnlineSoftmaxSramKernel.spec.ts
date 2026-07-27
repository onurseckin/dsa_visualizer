import { describe, it, expect } from "vitest";
import {
  onePassOnlineSoftmaxSramKernel,
  generateOnePassOnlineSoftmaxSramKernelSteps,
  DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
} from "./onePassOnlineSoftmaxSramKernel";

describe("One Pass Online Softmax Sram Kernel", () => {
  it("should have correct metadata", () => {
    expect(onePassOnlineSoftmaxSramKernel.id).toBe("one-pass-online-softmax-sram-kernel");
    expect(onePassOnlineSoftmaxSramKernel.title).toBe("One Pass Online Softmax Sram Kernel");
    expect(onePassOnlineSoftmaxSramKernel.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateOnePassOnlineSoftmaxSramKernelSteps(
      DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = onePassOnlineSoftmaxSramKernel.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = onePassOnlineSoftmaxSramKernel.code.split("\n");
    const lineExplanations = onePassOnlineSoftmaxSramKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(onePassOnlineSoftmaxSramKernel.examples?.length).toBe(3);
  });
});
