import { describe, expect, it } from "vitest";
import {
  lstmConstantErrorCarousel,
  DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
  generateLstmConstantErrorCarouselSteps,
} from "../lstmConstantErrorCarousel";
import type { VectorVisualSnapshot } from "../../../types/dsa";

describe("lstmConstantErrorCarousel algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(lstmConstantErrorCarousel.id).toBe("lstm-constant-error-carousel");
    expect(lstmConstantErrorCarousel.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(lstmConstantErrorCarousel.topicIds).toContain("ml_recurrent_gates");
    expect(lstmConstantErrorCarousel.defaultInput).toEqual(
      DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
    );
    expect(lstmConstantErrorCarousel.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 6" },
    ]);
  });

  it("should compute correct LSTM CEC step gate activations and updated states", () => {
    const steps = generateLstmConstantErrorCarouselSteps(
      DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(18);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.["c_t[0]"]).toBeCloseTo(2.145, 2);
    expect(distTable?.["h_t[0]"]).toBeCloseTo(0.711, 2);

    const snap = lastStep.primarySnapshot as VectorVisualSnapshot;
    expect(snap.kind).toBe("vector");
    expect(snap.vectors.length).toBe(2);
  });

  it("should clear historic cell state when forget gate is zero", () => {
    const inputFlushed = {
      ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
      weights: {
        ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT.weights,
        bf: [-10.0, -10.0],
      },
    };
    const steps = generateLstmConstantErrorCarouselSteps(inputFlushed);
    const lastStep = steps[steps.length - 1];
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable?.["c_t[0]"]).toBeLessThan(1.0);
  });
});

describe("lstmConstantErrorCarousel trivia metadata", () => {
  const meta = lstmConstantErrorCarousel.trivia;
  const lines = lstmConstantErrorCarousel.code.replace(/\s+$/, "").split("\n");

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
