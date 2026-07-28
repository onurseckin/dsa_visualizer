import { describe, it, expect } from "vitest";
import {
  astConstantFolding,
  DEFAULT_ASTCONSTANTFOLDING_INPUT,
  generateAstConstantFoldingSteps,
} from "./astConstantFolding";

describe("ast-constant-folding (AST Constant Folding Compiler Pass)", () => {
  it("should have correct metadata", () => {
    expect(astConstantFolding.id).toBe("ast-constant-folding");
    expect(astConstantFolding.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(astConstantFolding.topicIds).toContain("ml_autograd_dags");
    expect(astConstantFolding.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAstConstantFoldingSteps(DEFAULT_ASTCONSTANTFOLDING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("AST Constant Folding Compiler Pass");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = astConstantFolding.code.trim().split("\n").length;
    expect(astConstantFolding.trivia).toBeDefined();
    expect(astConstantFolding.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = astConstantFolding.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = astConstantFolding.code.trim().split("\n").length;
    const steps = generateAstConstantFoldingSteps(DEFAULT_ASTCONSTANTFOLDING_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
