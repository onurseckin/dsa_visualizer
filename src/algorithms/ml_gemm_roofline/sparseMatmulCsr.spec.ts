import { describe, it, expect } from "vitest";
import {
  sparseMatmulCsr,
  DEFAULT_SPARSEMATMULCSR_INPUT,
  generateSparseMatmulCsrSteps,
  SPARSEMATMULCSR_CODE,
} from "./sparseMatmulCsr";

describe("sparse-matmul-csr (Sparse Matrix Multiplication (CSR Format))", () => {
  it("should have correct metadata", () => {
    expect(sparseMatmulCsr.id).toBe("sparse-matmul-csr");
    expect(sparseMatmulCsr.isMlInfra).toBe(true);
    expect(sparseMatmulCsr.mlInfraLevel).toBe(2);
    expect(sparseMatmulCsr.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(sparseMatmulCsr.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = generateSparseMatmulCsrSteps(DEFAULT_SPARSEMATMULCSR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Sparse Matrix Multiplication (CSR Format)");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("SpMV Complete");
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const codeLines = SPARSEMATMULCSR_CODE.split("\n");
    const totalLines = codeLines.length;

    expect(sparseMatmulCsr.trivia).toBeDefined();
    if (sparseMatmulCsr.trivia?.lineExplanations) {
      for (let line = 1; line <= totalLines; line++) {
        expect(sparseMatmulCsr.trivia.lineExplanations[line]).toBeDefined();
        expect(typeof sparseMatmulCsr.trivia.lineExplanations[line]).toBe("string");
        expect(sparseMatmulCsr.trivia.lineExplanations[line].length).toBeGreaterThan(0);
      }
    }
  });

  it("should produce correct SpMV results", () => {
    const input = {
      values: [5, 9],
      col_indices: [0, 2],
      row_ptr: [0, 1, 1, 2],
      vector: [3, 1, 2],
    };
    const steps = generateSparseMatmulCsrSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe("[15, 0, 18]");
  });
});
