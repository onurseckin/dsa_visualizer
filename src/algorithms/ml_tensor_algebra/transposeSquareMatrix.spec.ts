import { describe, it, expect } from "vitest";
import {
  transposeSquareMatrix,
  DEFAULT_TRANSPOSESQUAREMATRIX_INPUT,
  generateTransposeSquareMatrixSteps,
  TRANSPOSESQUAREMATRIX_CODE,
} from "./transposeSquareMatrix";

describe("transpose-square-matrix (In-Place Square Matrix Transpose)", () => {
  it("should have correct metadata", () => {
    expect(transposeSquareMatrix.id).toBe("transpose-square-matrix");
    expect(transposeSquareMatrix.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(transposeSquareMatrix.topicIds).toContain("ml_tensor_algebra");
    expect(transposeSquareMatrix.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 steps with matrix primarySnapshot for default input", () => {
    const steps = generateTransposeSquareMatrixSteps(DEFAULT_TRANSPOSESQUAREMATRIX_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("transpose_square_matrix");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = TRANSPOSESQUAREMATRIX_CODE.trim().split("\n");
    const totalLines = codeLines.length;
    expect(totalLines).toBe(8);

    const lineExplanations = transposeSquareMatrix.trivia?.lineExplanations || {};
    for (let lineNum = 1; lineNum <= totalLines; lineNum++) {
      expect(lineExplanations[lineNum]).toBeDefined();
      expect(typeof lineExplanations[lineNum]).toBe("string");
      expect(lineExplanations[lineNum].length).toBeGreaterThan(0);
    }
  });
});
