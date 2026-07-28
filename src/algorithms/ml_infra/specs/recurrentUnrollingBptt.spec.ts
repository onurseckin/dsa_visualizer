import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT,
  RECURRENT_UNROLLING_BPTT_CODE,
  generateRecurrentUnrollingBpttSteps,
  recurrentUnrollingBptt,
} from "../recurrentUnrollingBptt";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("recurrentUnrollingBptt algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(recurrentUnrollingBptt.id).toBe("recurrent-unrolling-bptt");
    expect(recurrentUnrollingBptt.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(recurrentUnrollingBptt.topicIds).toContain("ml_recurrent_gates");
    expect(recurrentUnrollingBptt.defaultInput).toEqual(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
    expect(recurrentUnrollingBptt.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should compute hidden states over 3 time steps for default input", () => {
    const steps = generateRecurrentUnrollingBpttSteps(DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.T).toBe(3);

    const snap = lastStep.primarySnapshot as MatrixVisualSnapshot;
    expect(snap.kind).toBe("matrix");
    expect(snap.rows).toBe(3);
    expect(snap.cols).toBe(3);
    const hiddenStateCells = snap.cells.filter((cell) => cell.row === 2);
    expect(hiddenStateCells).toHaveLength(3);
    expect(hiddenStateCells.every((cell) => cell.state === "sorted")).toBe(true);
  });

  it("should handle empty inputs gracefully", () => {
    const steps = generateRecurrentUnrollingBpttSteps({
      inputs: [],
      wX: 1.0,
      wH: 0.5,
      bias: 0.0,
      initH: 0.0,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.valid).toBe(false);
  });
});

describe("recurrentUnrollingBptt trivia metadata", () => {
  const meta = recurrentUnrollingBptt.trivia;
  const lines = RECURRENT_UNROLLING_BPTT_CODE.replace(/\s+$/, "").split("\n");

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
