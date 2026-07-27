import { describe, it, expect } from "vitest";
import { loweredConv2dGemmExecutionEngine, DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT, generateLoweredConv2dGemmExecutionEngineSteps } from "./loweredConv2dGemmExecutionEngine";

describe("lowered-conv2d-gemm-execution-engine (Lowered Conv2D GEMM Execution Engine)", () => {
  it("should have correct metadata", () => {
    expect(loweredConv2dGemmExecutionEngine.id).toBe("lowered-conv2d-gemm-execution-engine");
    expect(loweredConv2dGemmExecutionEngine.isMlInfra).toBe(true);
    expect(loweredConv2dGemmExecutionEngine.mlInfraLevel).toBe(8);
    expect(loweredConv2dGemmExecutionEngine.mlInfraCategory).toBe("ml_convolutions");
    expect(loweredConv2dGemmExecutionEngine.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateLoweredConv2dGemmExecutionEngineSteps(DEFAULT_LOWEREDCONV2DGEMMEXECUTIONENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Lowered Conv2D GEMM Execution Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
