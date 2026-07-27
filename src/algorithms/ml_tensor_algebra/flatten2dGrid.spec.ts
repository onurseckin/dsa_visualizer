import { describe, it, expect } from "vitest";
import {
  flatten2dGrid,
  DEFAULT_FLATTEN2DGRID_INPUT,
  generateFlatten2dGridSteps,
} from "./flatten2dGrid";

describe("flatten-2d-grid (Flatten 2D Grid into 1D Contiguous Buffer)", () => {
  it("should have correct metadata", () => {
    expect(flatten2dGrid.id).toBe("flatten-2d-grid");
    expect(flatten2dGrid.isMlInfra).toBe(true);
    expect(flatten2dGrid.mlInfraLevel).toBe(1);
    expect(flatten2dGrid.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(flatten2dGrid.categories).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateFlatten2dGridSteps(DEFAULT_FLATTEN2DGRID_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("2D Grid Flattening");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Serialized 1D Contiguous Buffer");
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = flatten2dGrid.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = flatten2dGrid.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });
});
