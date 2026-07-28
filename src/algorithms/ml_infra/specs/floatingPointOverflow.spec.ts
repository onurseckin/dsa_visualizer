import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLOATING_POINT_OVERFLOW_INPUT,
  FLOATING_POINT_OVERFLOW_CODE,
  floatingPointOverflow,
  generateFloatingPointOverflowSteps,
} from "../floatingPointOverflow";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("floatingPointOverflow algorithm spec", () => {
  it("should have correct ML Infra Level 3 metadata", () => {
    expect(floatingPointOverflow.id).toBe("floating-point-overflow");
    expect(floatingPointOverflow.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(floatingPointOverflow.topicIds).toContain("ml_precision_quantization");
    expect(floatingPointOverflow.defaultInput).toEqual(DEFAULT_FLOATING_POINT_OVERFLOW_INPUT);
    expect(floatingPointOverflow.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should generate steps and stabilize large logits", () => {
    const steps = generateFloatingPointOverflowSteps(DEFAULT_FLOATING_POINT_OVERFLOW_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.success).toBe(true);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(3);
  });

  it("should detect overflow in un-stabilized large logits", () => {
    const steps = generateFloatingPointOverflowSteps({
      logits: [1000.0, 1001.0, 1002.0],
      useStabilized: false,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.success).toBe(false);
    expect(lastStep.explanation.what).toContain("Numerical Failure");
  });
});

describe("floatingPointOverflow trivia metadata", () => {
  const meta = floatingPointOverflow.trivia;
  const lines = FLOATING_POINT_OVERFLOW_CODE.replace(/\s+$/, "").split("\n");

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
