import { describe, expect, it } from "vitest";
import {
  binarySearchMatrix,
  DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateBinarySearchMatrixSteps,
} from "../binarySearchMatrix";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("binarySearchMatrix algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(binarySearchMatrix.id).toBe("binary-search-matrix");
    expect(binarySearchMatrix.title).toBe("Search a 2D Matrix");
    expect(binarySearchMatrix.category).toBe("binary_search");
    expect(binarySearchMatrix.difficulty).toBe("Medium");
    expect(binarySearchMatrix.defaultInput).toEqual(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
  });

  it("should generate at least 20 steps and find existing target in 2D matrix for default input", () => {
    const steps = generateBinarySearchMatrixSteps(DEFAULT_BINARY_SEARCH_MATRIX_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.variables.target).toBe(34);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.found).toBe(true);

    const snapshot = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snapshot.kind).toBe("grid");
    expect(snapshot.grid).toHaveLength(5);
    expect(snapshot.grid[0]).toHaveLength(5);
    expect(snapshot.grid[3][2].state).toBe("sorted");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = binarySearchMatrix.code.split("\n");
    const lineExplanations = binarySearchMatrix.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should generate steps and handle target not present in matrix", () => {
    const input = {
      matrix: [
        [1, 3, 5],
        [10, 11, 16],
      ],
      target: 15,
    };
    const steps = generateBinarySearchMatrixSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.found).toBe(false);
    expect(lastStep.explanation.what).toContain("not found");
  });

  it("should handle single element matrix input correctly", () => {
    const input = {
      matrix: [[42]],
      target: 42,
    };
    const steps = generateBinarySearchMatrixSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.found).toBe(true);
    expect(lastStep.variables.row).toBe(0);
    expect(lastStep.variables.col).toBe(0);
  });

  it("should handle empty or invalid matrix inputs", () => {
    const steps1 = generateBinarySearchMatrixSteps({ matrix: [], target: 5 });
    expect(steps1[0].variables.found).toBe(false);

    const steps2 = generateBinarySearchMatrixSteps({ matrix: [[]], target: 5 });
    expect(steps2[0].variables.found).toBe(false);

    const steps3 = generateBinarySearchMatrixSteps({
      matrix: null as unknown as number[][],
      target: 5,
    });
    expect(steps3[0].variables.found).toBe(false);
  });

  it("should handle target larger and smaller than mid element", () => {
    const stepsSmaller = generateBinarySearchMatrixSteps({ matrix: [[1, 3, 5, 7]], target: 1 });
    expect(stepsSmaller[stepsSmaller.length - 1].variables.found).toBe(true);

    const stepsLarger = generateBinarySearchMatrixSteps({ matrix: [[1, 3, 5, 7]], target: 7 });
    expect(stepsLarger[stepsLarger.length - 1].variables.found).toBe(true);
  });
});

describe("binarySearchMatrix trivia metadata", () => {
  const meta = binarySearchMatrix.trivia;
  const lines = binarySearchMatrix.code.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at real, non-empty lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      expect(lines[line - 1].trim()).not.toBe("");
    });
    // A hint on a line the drill never hides would never be shown.
    hinted.forEach((line) => expect(skipped).not.toContain(line));
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    expect(new Set(distractors).size).toBe(distractors.length);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
