import { describe, expect, it } from "vitest";
import {
  ARRAY_MATRIX_TRAVERSAL_CODE,
  DEFAULT_ARRAY_MATRIX_TRAVERSAL_INPUT,
  arrayMatrixTraversal,
  generateArrayMatrixTraversalSteps,
} from "../arrayMatrixTraversal";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("arrayMatrixTraversal algorithm spec", () => {
  it("should have correct ML Infra Level 1 metadata", () => {
    expect(arrayMatrixTraversal.id).toBe("2d-array-matrix-traversal");
    expect(arrayMatrixTraversal.isMlInfra).toBe(true);
    expect(arrayMatrixTraversal.mlInfraLevel).toBe(1);
    expect(arrayMatrixTraversal.category).toBe("ml_tensor_algebra");
    expect(arrayMatrixTraversal.defaultInput).toEqual(DEFAULT_ARRAY_MATRIX_TRAVERSAL_INPUT);
    expect(arrayMatrixTraversal.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should generate steps for row-major traversal", () => {
    const steps = generateArrayMatrixTraversalSteps(DEFAULT_ARRAY_MATRIX_TRAVERSAL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.total).toBe(9);

    const snap = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snap.kind).toBe("grid");
    expect(snap.grid.length).toBe(3);
    expect(snap.grid[0].length).toBe(3);
  });

  it("should generate steps for column-major traversal", () => {
    const input = {
      matrix: [
        [1, 2],
        [3, 4],
      ],
      order: "col-major" as const,
    };
    const steps = generateArrayMatrixTraversalSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.total).toBe(4);
  });

  it("should handle empty matrix input gracefully", () => {
    const steps = generateArrayMatrixTraversalSteps({ matrix: [], order: "row-major" });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.valid).toBe(false);
  });
});

describe("arrayMatrixTraversal trivia metadata", () => {
  const meta = arrayMatrixTraversal.trivia;
  const lines = ARRAY_MATRIX_TRAVERSAL_CODE.replace(/\s+$/, "").split("\n");

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
