import { describe, it, expect } from "vitest";
import {
  onePassOnlineSoftmaxSramKernel,
  generateOnePassOnlineSoftmaxSramKernelSteps,
  DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
} from "./onePassOnlineSoftmaxSramKernel";

describe("One Pass Online Softmax Sram Kernel", () => {
  it("should have correct metadata", () => {
    expect(onePassOnlineSoftmaxSramKernel.id).toBeDefined();
    expect(onePassOnlineSoftmaxSramKernel.title).toBe("One Pass Online Softmax Sram Kernel");
    expect(onePassOnlineSoftmaxSramKernel.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateOnePassOnlineSoftmaxSramKernelSteps(
      DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(onePassOnlineSoftmaxSramKernel.examples?.length).toBe(3);
  });
});
