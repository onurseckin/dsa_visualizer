import { describe, it, expect } from "vitest";
import { tritonMlirToPtxCompilerPipelineSimulator } from "./tritonMlirToPtxCompilerPipelineSimulator";

describe("tritonMlirToPtxCompilerPipelineSimulator", () => {
  it("should have valid metadata", () => {
    expect(tritonMlirToPtxCompilerPipelineSimulator.id).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.title).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.code).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tritonMlirToPtxCompilerPipelineSimulator.generateSteps(
      tritonMlirToPtxCompilerPipelineSimulator.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
