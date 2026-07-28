import { describe, it, expect } from "vitest";
import {
  matrixBlockSumFlat,
  DEFAULT_MATRIXBLOCKSUMFLAT_INPUT,
  generateMatrixBlockSumFlatSteps,
  MATRIXBLOCKSUMFLAT_CODE,
} from "./matrixBlockSumFlat";

describe("matrix-block-sum-flat (Submatrix Block Sum with 2D Prefix Array)", () => {
  it("should have correct metadata and structure", () => {
    expect(matrixBlockSumFlat.id).toBe("matrix-block-sum-flat");
    expect(matrixBlockSumFlat.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(matrixBlockSumFlat.topicIds).toContain("ml_tensor_algebra");
    expect(matrixBlockSumFlat.topicIds).toContain("ml_tensor_algebra");
    expect(matrixBlockSumFlat.topicGuide?.sections.length).toBe(5);
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const totalLines = MATRIXBLOCKSUMFLAT_CODE.split("\n").length;
    const explanations = matrixBlockSumFlat.trivia?.lineExplanations ?? {};
    for (let line = 1; line <= totalLines; line++) {
      expect(explanations[line], `Line ${line} missing in lineExplanations`).toBeDefined();
      expect(explanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should generate >= 20 steps for default input and use matrix snapshot", () => {
    const steps = generateMatrixBlockSumFlatSteps(DEFAULT_MATRIXBLOCKSUMFLAT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Submatrix Block Sum");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Result Matrix");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
  });

  it("should correctly compute submatrix block sums", () => {
    const steps = generateMatrixBlockSumFlatSteps({
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      k: 1,
    });
    const lastStep = steps[steps.length - 1];
    const parsedResult = JSON.parse(String(lastStep.variables.result));
    expect(parsedResult).toEqual([
      [12, 21, 16],
      [27, 45, 33],
      [24, 39, 28],
    ]);
  });
});
