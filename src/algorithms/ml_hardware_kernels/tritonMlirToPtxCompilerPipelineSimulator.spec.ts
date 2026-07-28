import { describe, it, expect } from "vitest";
import { tritonMlirToPtxCompilerPipelineSimulator } from "./tritonMlirToPtxCompilerPipelineSimulator";

describe("triton-mlir-to-ptx-compiler-pipeline-simulator", () => {
  it("should have valid metadata", () => {
    expect(tritonMlirToPtxCompilerPipelineSimulator.id).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.title).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.code).toBeDefined();
    expect(tritonMlirToPtxCompilerPipelineSimulator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tritonMlirToPtxCompilerPipelineSimulator.generateSteps(
      tritonMlirToPtxCompilerPipelineSimulator.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tritonMlirToPtxCompilerPipelineSimulator.code.trim().split("\n");
    const lineExplanations = tritonMlirToPtxCompilerPipelineSimulator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
