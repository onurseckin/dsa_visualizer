import { describe, it, expect } from "vitest";
import {
  antiDiagonalExtraction,
  DEFAULT_ANTIDIAGONALEXTRACTION_INPUT,
  generateAntiDiagonalExtractionSteps,
} from "./antiDiagonalExtraction";

describe("anti-diagonal-extraction (Anti-Diagonal Matrix Traversal)", () => {
  it("should have correct metadata", () => {
    expect(antiDiagonalExtraction.id).toBe("anti-diagonal-extraction");
    expect(antiDiagonalExtraction.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(antiDiagonalExtraction.topicIds).toContain("ml_tensor_algebra");
    expect(antiDiagonalExtraction.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateAntiDiagonalExtractionSteps(DEFAULT_ANTIDIAGONALEXTRACTION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Anti-Diagonal Wavefront");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Wavefront Anti-Diagonals");
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = antiDiagonalExtraction.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = antiDiagonalExtraction.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });
});
