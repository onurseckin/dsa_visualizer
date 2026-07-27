import { describe, expect, it } from "vitest";
import { DEFAULT_NQUEENS_INPUT, generateNQueensSteps, nQueens } from "../nQueens";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("nQueens algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(nQueens.id).toBe("n-queens");
    expect(nQueens.title).toBe("N-Queens Backtracking");
    expect(nQueens.category).toBe("backtracking");
    expect(nQueens.difficulty).toBe("Hard");
    expect(nQueens.defaultInput).toEqual(DEFAULT_NQUEENS_INPUT);
  });

  it("should generate steps and find 2 solutions for 4-Queens", () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalSolutions).toBe(2);

    const snapshot = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snapshot.kind).toBe("grid");
    expect(snapshot.grid).toHaveLength(4);
    expect(snapshot.grid[0]).toHaveLength(4);
  });

  it("should handle N = 1 board correctly", () => {
    const steps = generateNQueensSteps({ n: 1 });
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.totalSolutions).toBe(1);
  });

  it("should handle missing or 0 n input and fallback to 4", () => {
    const steps = generateNQueensSteps({ n: 0 });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalSolutions).toBe(2);
  });

  it("ensures step generator is pure and returns valid code lines and explanations", () => {
    const input = { ...DEFAULT_NQUEENS_INPUT };
    const originalInputJSON = JSON.stringify(input);

    const steps = generateNQueensSteps(input);

    // Verify input immutability
    expect(JSON.stringify(input)).toBe(originalInputJSON);

    // Verify Python code line bounds (1 to 28)
    const pythonLineCount = nQueens.code.split("\n").length;
    steps.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx);
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(pythonLineCount);
      expect(step.explanation.what.length).toBeGreaterThan(0);
      expect(step.explanation.why.length).toBeGreaterThan(0);
    });
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(nQueens.examples).toHaveLength(3);
    expect(nQueens.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(nQueens.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of nQueens.examples!) {
      const steps = nQueens.generateSteps(example.input as { n: number });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
