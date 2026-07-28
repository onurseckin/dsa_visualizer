import { describe, it, expect } from "vitest";
import {
  validNeighborGridBounds,
  DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT,
  generateValidNeighborGridBoundsSteps,
  VALIDNEIGHBORGRIDBOUNDS_CODE,
} from "./validNeighborGridBounds";

describe("valid-neighbor-grid-bounds (Valid 2D Grid Neighbor Bounds Check)", () => {
  it("should have correct metadata", () => {
    expect(validNeighborGridBounds.id).toBe("valid-neighbor-grid-bounds");
    expect(validNeighborGridBounds.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(validNeighborGridBounds.topicIds).toContain("ml_tensor_algebra");
    expect(validNeighborGridBounds.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 15 steps with matrix primarySnapshot for default input", () => {
    const steps = generateValidNeighborGridBoundsSteps(DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(15);
    expect(steps[0].explanation.what).toContain("valid_neighbor_grid_bounds");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = VALIDNEIGHBORGRIDBOUNDS_CODE.trim().split("\n");
    const totalLines = codeLines.length;
    expect(totalLines).toBe(10);

    const lineExplanations = validNeighborGridBounds.trivia?.lineExplanations || {};
    for (let lineNum = 1; lineNum <= totalLines; lineNum++) {
      expect(lineExplanations[lineNum]).toBeDefined();
      expect(typeof lineExplanations[lineNum]).toBe("string");
      expect(lineExplanations[lineNum].length).toBeGreaterThan(0);
    }
  });
});
