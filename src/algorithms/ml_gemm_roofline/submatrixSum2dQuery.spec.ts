import { describe, it, expect } from "vitest";
import { submatrixSum2dQuery, DEFAULT_SUBMATRIXSUM2DQUERY_INPUT, generateSubmatrixSum2dQuerySteps } from "./submatrixSum2dQuery";

describe("submatrix-sum-2d-query (2D Submatrix Region Sum Query)", () => {
  it("should have correct metadata", () => {
    expect(submatrixSum2dQuery.id).toBe("submatrix-sum-2d-query");
    expect(submatrixSum2dQuery.isMlInfra).toBe(true);
    expect(submatrixSum2dQuery.mlInfraLevel).toBe(2);
    expect(submatrixSum2dQuery.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(submatrixSum2dQuery.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSubmatrixSum2dQuerySteps(DEFAULT_SUBMATRIXSUM2DQUERY_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("2D Submatrix Region Sum Query");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
