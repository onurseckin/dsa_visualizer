import { describe, it, expect } from "vitest";
import { astConstantFolding, DEFAULT_ASTCONSTANTFOLDING_INPUT, generateAstConstantFoldingSteps } from "./astConstantFolding";

describe("ast-constant-folding (AST Constant Folding Compiler Pass)", () => {
  it("should have correct metadata", () => {
    expect(astConstantFolding.id).toBe("ast-constant-folding");
    expect(astConstantFolding.isMlInfra).toBe(true);
    expect(astConstantFolding.mlInfraLevel).toBe(3);
    expect(astConstantFolding.mlInfraCategory).toBe("ml_autograd_dags");
    expect(astConstantFolding.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAstConstantFoldingSteps(DEFAULT_ASTCONSTANTFOLDING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("AST Constant Folding Compiler Pass");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
