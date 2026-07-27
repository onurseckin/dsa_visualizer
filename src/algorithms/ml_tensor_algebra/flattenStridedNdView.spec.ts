import { describe, it, expect } from "vitest";
import {
  flattenStridedNdView,
  DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT,
  generateFlattenStridedNdViewSteps,
} from "./flattenStridedNdView";

describe("flatten-strided-nd-view (Multi-Dimensional Strided Coordinate Mapper)", () => {
  it("should have correct metadata", () => {
    expect(flattenStridedNdView.id).toBe("flatten-strided-nd-view");
    expect(flattenStridedNdView.isMlInfra).toBe(true);
    expect(flattenStridedNdView.mlInfraLevel).toBe(1);
    expect(flattenStridedNdView.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(flattenStridedNdView.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlattenStridedNdViewSteps(DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Multi-Dimensional Strided Coordinate Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
