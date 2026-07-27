import { describe, it, expect } from "vitest";
import { sparseMatmulCsr, DEFAULT_SPARSEMATMULCSR_INPUT, generateSparseMatmulCsrSteps } from "./sparseMatmulCsr";

describe("sparse-matmul-csr (Sparse Matrix Multiplication (CSR Format))", () => {
  it("should have correct metadata", () => {
    expect(sparseMatmulCsr.id).toBe("sparse-matmul-csr");
    expect(sparseMatmulCsr.isMlInfra).toBe(true);
    expect(sparseMatmulCsr.mlInfraLevel).toBe(2);
    expect(sparseMatmulCsr.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(sparseMatmulCsr.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSparseMatmulCsrSteps(DEFAULT_SPARSEMATMULCSR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Sparse Matrix Multiplication (CSR Format)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
