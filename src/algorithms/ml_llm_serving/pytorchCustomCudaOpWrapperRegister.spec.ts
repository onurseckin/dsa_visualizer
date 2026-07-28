import { describe, it, expect } from "vitest";
import {
  pytorchCustomCudaOpWrapperRegister,
  DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT,
  generatePytorchCustomCudaOpWrapperRegisterSteps,
} from "./pytorchCustomCudaOpWrapperRegister";

describe("pytorch-custom-cuda-op-wrapper-register (PyTorch `@CustomOp.register` C++ CUDA Kernel Register)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(pytorchCustomCudaOpWrapperRegister.id).toBe("pytorch-custom-cuda-op-wrapper-register");
    expect(
      pytorchCustomCudaOpWrapperRegister.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(pytorchCustomCudaOpWrapperRegister.topicIds).toContain("ml_llm_serving");
    expect(pytorchCustomCudaOpWrapperRegister.topicIds).toContain("ml_llm_serving");
    expect(pytorchCustomCudaOpWrapperRegister.defaultInput).toEqual(
      DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT,
    );

    const codeLines = pytorchCustomCudaOpWrapperRegister.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      pytorchCustomCudaOpWrapperRegister.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(pytorchCustomCudaOpWrapperRegister.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generatePytorchCustomCudaOpWrapperRegisterSteps(
      DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(
      pytorchCustomCudaOpWrapperRegister.code.trim().split("\n").length,
    );
  });
});
