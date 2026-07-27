import { describe, expect, it } from "vitest";
import {
  DEFAULT_MATRIX_MULTIPLICATION_NAIVE_INPUT,
  MATRIX_MULTIPLICATION_NAIVE_CODE,
  generateMatrixMultiplicationNaiveSteps,
  matrixMultiplicationNaive,
} from "../matrixMultiplicationNaive";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("matrixMultiplicationNaive algorithm spec", () => {
  it("should have correct ML Infra Level 1 metadata", () => {
    expect(matrixMultiplicationNaive.id).toBe("matrix-multiplication-naive");
    expect(matrixMultiplicationNaive.isMlInfra).toBe(true);
    expect(matrixMultiplicationNaive.mlInfraLevel).toBe(1);
    expect(matrixMultiplicationNaive.category).toBe("ml_gemm_roofline");
    expect(matrixMultiplicationNaive.defaultInput).toEqual(
      DEFAULT_MATRIX_MULTIPLICATION_NAIVE_INPUT
    );
    expect(matrixMultiplicationNaive.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should compute correct GEMM matrix output C", () => {
    const steps = generateMatrixMultiplicationNaiveSteps(
      DEFAULT_MATRIX_MULTIPLICATION_NAIVE_INPUT
    );
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snap.kind).toBe("grid");
    // Matrix C values: [[19, 22], [43, 50]]
    expect(snap.grid[0][0].distance).toBe(19);
    expect(snap.grid[0][1].distance).toBe(22);
    expect(snap.grid[1][0].distance).toBe(43);
    expect(snap.grid[1][1].distance).toBe(50);
  });

  it("should detect inner dimension mismatch", () => {
    const badInput = {
      A: [[1, 2, 3]],
      B: [[1, 2]],
    };
    const steps = generateMatrixMultiplicationNaiveSteps(badInput);
    expect(steps.length).toBe(1);
    expect(steps[0].variables.valid).toBe(false);
  });
});

describe("matrixMultiplicationNaive trivia metadata", () => {
  const meta = matrixMultiplicationNaive.trivia;
  const lines = MATRIX_MULTIPLICATION_NAIVE_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
