import { describe, it, expect } from "vitest";
import {
  validNeighborGridBounds,
  DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT,
  generateValidNeighborGridBoundsSteps,
} from "./validNeighborGridBounds";

describe("valid-neighbor-grid-bounds (Valid 2D Grid Neighbor Bounds Check)", () => {
  it("should have correct metadata", () => {
    expect(validNeighborGridBounds.id).toBe("valid-neighbor-grid-bounds");
    expect(validNeighborGridBounds.isMlInfra).toBe(true);
    expect(validNeighborGridBounds.mlInfraLevel).toBe(1);
    expect(validNeighborGridBounds.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(validNeighborGridBounds.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateValidNeighborGridBoundsSteps(DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Valid 2D Grid Neighbor Bounds Check");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
