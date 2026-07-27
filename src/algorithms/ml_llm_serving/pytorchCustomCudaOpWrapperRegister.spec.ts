import { describe, it, expect } from "vitest";
import { pytorchCustomCudaOpWrapperRegister, DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT, generatePytorchCustomCudaOpWrapperRegisterSteps } from "./pytorchCustomCudaOpWrapperRegister";

describe("pytorch-custom-cuda-op-wrapper-register (PyTorch `@CustomOp.register` C++ CUDA Kernel Register)", () => {
  it("should have correct metadata", () => {
    expect(pytorchCustomCudaOpWrapperRegister.id).toBe("pytorch-custom-cuda-op-wrapper-register");
    expect(pytorchCustomCudaOpWrapperRegister.isMlInfra).toBe(true);
    expect(pytorchCustomCudaOpWrapperRegister.mlInfraLevel).toBe(12);
    expect(pytorchCustomCudaOpWrapperRegister.mlInfraCategory).toBe("ml_llm_serving");
    expect(pytorchCustomCudaOpWrapperRegister.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePytorchCustomCudaOpWrapperRegisterSteps(DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("PyTorch `@CustomOp.register` C++ CUDA Kernel Register");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
