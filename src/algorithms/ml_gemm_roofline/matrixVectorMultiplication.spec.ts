import { describe, it, expect } from "vitest";
import {
  matrixVectorMultiplication,
  DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
  generateMatrixVectorMultiplicationSteps,
  MATRIXVECTORMULTIPLICATION_CODE,
} from "./matrixVectorMultiplication";

describe("matrix-vector-multiplication (Matrix-Vector Multiplication GEMV)", () => {
  it("should have correct metadata", () => {
    expect(matrixVectorMultiplication.id).toBe("matrix-vector-multiplication");
    expect(matrixVectorMultiplication.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(matrixVectorMultiplication.topicIds).toContain("ml_gemm_roofline");
    expect(matrixVectorMultiplication.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateMatrixVectorMultiplicationSteps(DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("GEMV Matrix-Vector Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = MATRIXVECTORMULTIPLICATION_CODE.split("\n");
    const trivia = matrixVectorMultiplication.trivia;
    expect(trivia).toBeDefined();
    if (!trivia) return;

    for (let i = 1; i <= codeLines.length; i++) {
      const explanation = trivia.lineExplanations?.[i];
      expect(explanation).toBeDefined();
      expect(typeof explanation).toBe("string");
      expect(explanation?.length).toBeGreaterThan(0);
    }
  });
});
