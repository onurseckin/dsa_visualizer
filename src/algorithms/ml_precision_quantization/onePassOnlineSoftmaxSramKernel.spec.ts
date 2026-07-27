import { describe, it, expect } from "vitest";
import { onePassOnlineSoftmaxSramKernel, DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT, generateOnePassOnlineSoftmaxSramKernelSteps } from "./onePassOnlineSoftmaxSramKernel";

describe("one-pass-online-softmax-sram-kernel (1-Pass Online Softmax Streaming GPU Kernel)", () => {
  it("should have correct metadata", () => {
    expect(onePassOnlineSoftmaxSramKernel.id).toBe("one-pass-online-softmax-sram-kernel");
    expect(onePassOnlineSoftmaxSramKernel.isMlInfra).toBe(true);
    expect(onePassOnlineSoftmaxSramKernel.mlInfraLevel).toBe(4);
    expect(onePassOnlineSoftmaxSramKernel.mlInfraCategory).toBe("ml_precision_quantization");
    expect(onePassOnlineSoftmaxSramKernel.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateOnePassOnlineSoftmaxSramKernelSteps(DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("1-Pass Online Softmax Streaming GPU Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
