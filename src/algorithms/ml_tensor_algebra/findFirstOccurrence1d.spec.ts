import { describe, it, expect } from "vitest";
import {
  findFirstOccurrence1d,
  DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT,
  generateFindFirstOccurrence1dSteps,
} from "./findFirstOccurrence1d";

describe("find-first-occurrence-1d (Find First Occurrence in 1D Buffer)", () => {
  it("should have correct metadata", () => {
    expect(findFirstOccurrence1d.id).toBe("find-first-occurrence-1d");
    expect(findFirstOccurrence1d.isMlInfra).toBe(true);
    expect(findFirstOccurrence1d.mlInfraLevel).toBe(1);
    expect(findFirstOccurrence1d.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(findFirstOccurrence1d.categories).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateFindFirstOccurrence1dSteps(DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Strided 1D Memory Scan");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Match Physical Offset Result");
  });

  it("should map every line of code in trivia lineExplanations", () => {
    const trivia = findFirstOccurrence1d.trivia;
    expect(trivia).toBeDefined();
    if (!trivia || !trivia.lineExplanations) return;

    const codeLines = findFirstOccurrence1d.code.split("\n");
    const lineKeys = Object.keys(trivia.lineExplanations).map(Number);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineKeys).toContain(i);
    }
  });
});
