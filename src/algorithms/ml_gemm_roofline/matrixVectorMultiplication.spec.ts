import { describe, it, expect } from "vitest";
import { matrixVectorMultiplication, DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT, generateMatrixVectorMultiplicationSteps } from "./matrixVectorMultiplication";

describe("matrix-vector-multiplication (Matrix-Vector Multiplication (GEMV))", () => {
  it("should have correct metadata", () => {
    expect(matrixVectorMultiplication.id).toBe("matrix-vector-multiplication");
    expect(matrixVectorMultiplication.isMlInfra).toBe(true);
    expect(matrixVectorMultiplication.mlInfraLevel).toBe(2);
    expect(matrixVectorMultiplication.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(matrixVectorMultiplication.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMatrixVectorMultiplicationSteps(DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Matrix-Vector Multiplication (GEMV)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
