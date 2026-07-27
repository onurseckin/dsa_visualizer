import { describe, it, expect } from "vitest";
import { tritonMlirToPtxCompilerPipelineSimulator, DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT, generateTritonMlirToPtxCompilerPipelineSimulatorSteps } from "./tritonMlirToPtxCompilerPipelineSimulator";

describe("triton-mlir-to-ptx-compiler-pipeline-simulator (Triton MLIR-to-PTX Compiler Pipeline Simulator)", () => {
  it("should have correct metadata", () => {
    expect(tritonMlirToPtxCompilerPipelineSimulator.id).toBe("triton-mlir-to-ptx-compiler-pipeline-simulator");
    expect(tritonMlirToPtxCompilerPipelineSimulator.isMlInfra).toBe(true);
    expect(tritonMlirToPtxCompilerPipelineSimulator.mlInfraLevel).toBe(10);
    expect(tritonMlirToPtxCompilerPipelineSimulator.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tritonMlirToPtxCompilerPipelineSimulator.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonMlirToPtxCompilerPipelineSimulatorSteps(DEFAULT_TRITONMLIRTOPTXCOMPILERPIPELINESIMULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton MLIR-to-PTX Compiler Pipeline Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
