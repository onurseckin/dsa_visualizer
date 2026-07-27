import { describe, it, expect } from "vitest";
import {
  flattenStridedNdView,
  DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT,
  generateFlattenStridedNdViewSteps,
  FLATTENSTRIDEDNDVIEW_CODE,
} from "./flattenStridedNdView";

describe("flatten-strided-nd-view (Multi-Dimensional Strided Coordinate Mapper)", () => {
  it("should have correct metadata and structure", () => {
    expect(flattenStridedNdView.id).toBe("flatten-strided-nd-view");
    expect(flattenStridedNdView.isMlInfra).toBe(true);
    expect(flattenStridedNdView.mlInfraLevel).toBe(1);
    expect(flattenStridedNdView.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(flattenStridedNdView.categories).toContain("ml_tensor_algebra");
    expect(flattenStridedNdView.topicGuide?.sections.length).toBe(5);
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const totalLines = FLATTENSTRIDEDNDVIEW_CODE.split("\n").length;
    const explanations = flattenStridedNdView.trivia?.lineExplanations ?? {};
    for (let line = 1; line <= totalLines; line++) {
      expect(explanations[line], `Line ${line} missing in lineExplanations`).toBeDefined();
      expect(explanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should generate >= 20 steps for default input and use matrix snapshot", () => {
    const steps = generateFlattenStridedNdViewSteps(DEFAULT_FLATTENSTRIDEDNDVIEW_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("N-Dimensional Strided Coordinate");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Flat Memory Offset");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
  });

  it("should correctly compute physical flat memory offset", () => {
    const coords = [1, 2, 3, 4, 2];
    const strides = [192, 48, 12, 3, 1];
    const steps = generateFlattenStridedNdViewSteps({ coords, strides });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.flat_offset).toBe(338);
  });
});
