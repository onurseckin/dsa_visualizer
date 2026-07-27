import { describe, it, expect } from "vitest";
import {
  causalLowerTriangularMask,
  DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT,
  generateCausalLowerTriangularMaskSteps,
} from "./causalLowerTriangularMask";

describe("causal-lower-triangular-mask (Causal Lower-Triangular Mask Generator)", () => {
  it("should have correct metadata", () => {
    expect(causalLowerTriangularMask.id).toBe("causal-lower-triangular-mask");
    expect(causalLowerTriangularMask.isMlInfra).toBe(true);
    expect(causalLowerTriangularMask.mlInfraLevel).toBe(7);
    expect(causalLowerTriangularMask.mlInfraCategory).toBe("ml_attention_geometry");
    expect(causalLowerTriangularMask.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateCausalLowerTriangularMaskSteps(DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Causal Lower-Triangular Mask Generator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
