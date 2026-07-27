import { describe, it, expect } from "vitest";
import {
  transposeSquareMatrix,
  DEFAULT_TRANSPOSESQUAREMATRIX_INPUT,
  generateTransposeSquareMatrixSteps,
} from "./transposeSquareMatrix";

describe("transpose-square-matrix (In-Place Square Matrix Transpose)", () => {
  it("should have correct metadata", () => {
    expect(transposeSquareMatrix.id).toBe("transpose-square-matrix");
    expect(transposeSquareMatrix.isMlInfra).toBe(true);
    expect(transposeSquareMatrix.mlInfraLevel).toBe(1);
    expect(transposeSquareMatrix.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(transposeSquareMatrix.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTransposeSquareMatrixSteps(DEFAULT_TRANSPOSESQUAREMATRIX_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("In-Place Square Matrix Transpose");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
