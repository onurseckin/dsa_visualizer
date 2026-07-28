import { describe, it, expect } from "vitest";
import {
  transposeMatrixSquare,
  DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
  generateTransposeMatrixSquareSteps,
  TRANSPOSEMATRIXSQUARE_CODE,
} from "./transposeMatrixSquare";

describe("transpose-matrix-square (Square Matrix Transpose Operator)", () => {
  it("should have correct metadata", () => {
    expect(transposeMatrixSquare.id).toBe("transpose-matrix-square");
    expect(transposeMatrixSquare.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(transposeMatrixSquare.topicIds).toContain("ml_gemm_roofline");
    expect(transposeMatrixSquare.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = generateTransposeMatrixSquareSteps(DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Square Matrix Transpose Operator");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain(
      "In-Place Matrix Transpose Complete",
    );
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const codeLines = TRANSPOSEMATRIXSQUARE_CODE.split("\n");
    const totalLines = codeLines.length;

    expect(transposeMatrixSquare.trivia).toBeDefined();
    if (transposeMatrixSquare.trivia?.lineExplanations) {
      for (let line = 1; line <= totalLines; line++) {
        expect(transposeMatrixSquare.trivia.lineExplanations[line]).toBeDefined();
        expect(typeof transposeMatrixSquare.trivia.lineExplanations[line]).toBe("string");
        expect(transposeMatrixSquare.trivia.lineExplanations[line].length).toBeGreaterThan(0);
      }
    }
  });

  it("should correctly transpose 2x2 matrix", () => {
    const input = {
      matrix: [
        [10, 20],
        [30, 40],
      ],
    };
    const steps = generateTransposeMatrixSquareSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState?.customState?.matrixState).toBe("[10,30], [20,40]");
  });
});
