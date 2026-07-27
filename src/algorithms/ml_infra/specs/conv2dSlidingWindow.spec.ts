import { describe, expect, it } from "vitest";
import {
  CONV2D_SLIDING_WINDOW_CODE,
  DEFAULT_CONV2D_SLIDING_WINDOW_INPUT,
  conv2dSlidingWindow,
  generateConv2dSlidingWindowSteps,
} from "../conv2dSlidingWindow";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("conv2dSlidingWindow algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(conv2dSlidingWindow.id).toBe("conv2d-sliding-window");
    expect(conv2dSlidingWindow.isMlInfra).toBe(true);
    expect(conv2dSlidingWindow.mlInfraLevel).toBe(6);
    expect(conv2dSlidingWindow.category).toBe("ml_convolutions");
    expect(conv2dSlidingWindow.defaultInput).toEqual(DEFAULT_CONV2D_SLIDING_WINDOW_INPUT);
    expect(conv2dSlidingWindow.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should compute correct feature map for default 4x4 input and 2x2 kernel", () => {
    const steps = generateConv2dSlidingWindowSteps(DEFAULT_CONV2D_SLIDING_WINDOW_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);

    const snap = lastStep.primarySnapshot as GridVisualSnapshot;
    expect(snap.kind).toBe("grid");
    expect(snap.grid.length).toBe(3);
    expect(snap.grid[0].length).toBe(3);
    expect(snap.grid[0][0].distance).toBe(2);
  });

  it("should handle kernel larger than input by returning empty step", () => {
    const invalidInput = {
      inputMatrix: [[1, 2]],
      kernel: [
        [1, 1, 1],
        [1, 1, 1],
      ],
      stride: 1,
      padding: 0,
    };
    const steps = generateConv2dSlidingWindowSteps(invalidInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.valid).toBe(false);
  });
});

describe("conv2dSlidingWindow trivia metadata", () => {
  const meta = conv2dSlidingWindow.trivia;
  const lines = CONV2D_SLIDING_WINDOW_CODE.replace(/\s+$/, "").split("\n");

  it("points skipLines and hints at valid lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
    });
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
