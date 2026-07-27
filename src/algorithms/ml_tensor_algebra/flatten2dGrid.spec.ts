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

  it("should generate valid algorithm steps", () => {
    const steps = generateFlatten2dGridSteps(DEFAULT_FLATTEN2DGRID_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
