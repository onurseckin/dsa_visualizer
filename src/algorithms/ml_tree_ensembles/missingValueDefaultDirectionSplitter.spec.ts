import { describe, it, expect } from "vitest";
import { missingValueDefaultDirectionSplitter, DEFAULT_MISSINGVALUEDEFAULTDIRECTIONSPLITTER_INPUT, generateMissingValueDefaultDirectionSplitterSteps } from "./missingValueDefaultDirectionSplitter";

describe("missing-value-default-direction-splitter (XGBoost Missing Value Default Direction Allocator)", () => {
  it("should have correct metadata", () => {
    expect(missingValueDefaultDirectionSplitter.id).toBe("missing-value-default-direction-splitter");
    expect(missingValueDefaultDirectionSplitter.isMlInfra).toBe(true);
    expect(missingValueDefaultDirectionSplitter.mlInfraLevel).toBe(9);
    expect(missingValueDefaultDirectionSplitter.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(missingValueDefaultDirectionSplitter.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMissingValueDefaultDirectionSplitterSteps(DEFAULT_MISSINGVALUEDEFAULTDIRECTIONSPLITTER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("XGBoost Missing Value Default Direction Allocator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
