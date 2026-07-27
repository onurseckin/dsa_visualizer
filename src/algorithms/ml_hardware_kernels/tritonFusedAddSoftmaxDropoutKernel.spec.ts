import { describe, it, expect } from "vitest";
import { tritonFusedAddSoftmaxDropoutKernel } from "./tritonFusedAddSoftmaxDropoutKernel";

describe("tritonFusedAddSoftmaxDropoutKernel", () => {
  it("should have valid metadata", () => {
    expect(tritonFusedAddSoftmaxDropoutKernel.id).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.title).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.code).toBeDefined();
    expect(tritonFusedAddSoftmaxDropoutKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tritonFusedAddSoftmaxDropoutKernel.generateSteps(
      tritonFusedAddSoftmaxDropoutKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tritonFusedAddSoftmaxDropoutKernel.code.trim().split("\n");
    const lineExplanations = tritonFusedAddSoftmaxDropoutKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
