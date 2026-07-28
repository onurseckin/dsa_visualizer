import { describe, it, expect } from "vitest";
import {
  submatrixSum2dQuery,
  DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
  generateSubmatrixSum2dQuerySteps,
  SUBMATRIXSUM2DQUERY_CODE,
} from "./submatrixSum2dQuery";

describe("submatrix-sum-2d-query (2D Submatrix Region Sum Query Engine)", () => {
  it("should have correct metadata", () => {
    expect(submatrixSum2dQuery.id).toBe("submatrix-sum-2d-query");
    expect(submatrixSum2dQuery.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(submatrixSum2dQuery.topicIds).toContain("ml_gemm_roofline");
    expect(submatrixSum2dQuery.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = generateSubmatrixSum2dQuerySteps(DEFAULT_SUBMATRIXSUM2DQUERY_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("2D Submatrix Region Sum Query Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Total Submatrix Sum");
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const codeLines = SUBMATRIXSUM2DQUERY_CODE.split("\n");
    const totalLines = codeLines.length;

    expect(submatrixSum2dQuery.trivia).toBeDefined();
    if (submatrixSum2dQuery.trivia?.lineExplanations) {
      for (let line = 1; line <= totalLines; line++) {
        expect(submatrixSum2dQuery.trivia.lineExplanations[line]).toBeDefined();
        expect(typeof submatrixSum2dQuery.trivia.lineExplanations[line]).toBe("string");
        expect(submatrixSum2dQuery.trivia.lineExplanations[line].length).toBeGreaterThan(0);
      }
    }
  });

  it("should compute exact 4-corner region sum", () => {
    const steps = generateSubmatrixSum2dQuerySteps(DEFAULT_SUBMATRIXSUM2DQUERY_INPUT);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total).toBe(99);
  });
});
