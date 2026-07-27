import { describe, it, expect } from "vitest";
import {
  transposeMatrixSquare,
  DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
  generateTransposeMatrixSquareSteps,
} from "./transposeMatrixSquare";

describe("transpose-matrix-square (Square Matrix Transpose Operator)", () => {
  it("should have correct metadata", () => {
    expect(transposeMatrixSquare.id).toBe("transpose-matrix-square");
    expect(transposeMatrixSquare.isMlInfra).toBe(true);
    expect(transposeMatrixSquare.mlInfraLevel).toBe(2);
    expect(transposeMatrixSquare.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(transposeMatrixSquare.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTransposeMatrixSquareSteps(DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Square Matrix Transpose Operator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
