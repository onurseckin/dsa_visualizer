import { describe, it, expect } from "vitest";
import { matrixBlockSumFlat, DEFAULT_MATRIXBLOCKSUMFLAT_INPUT, generateMatrixBlockSumFlatSteps } from "./matrixBlockSumFlat";

describe("matrix-block-sum-flat (Submatrix Block Sum with 2D Prefix Array)", () => {
  it("should have correct metadata", () => {
    expect(matrixBlockSumFlat.id).toBe("matrix-block-sum-flat");
    expect(matrixBlockSumFlat.isMlInfra).toBe(true);
    expect(matrixBlockSumFlat.mlInfraLevel).toBe(1);
    expect(matrixBlockSumFlat.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(matrixBlockSumFlat.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMatrixBlockSumFlatSteps(DEFAULT_MATRIXBLOCKSUMFLAT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Submatrix Block Sum with 2D Prefix Array");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
