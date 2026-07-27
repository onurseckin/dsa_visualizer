import { describe, expect, it } from "vitest";
import {
  lstmConstantErrorCarousel,
  DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
  generateLstmConstantErrorCarouselSteps,
} from "../lstmConstantErrorCarousel";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("lstmConstantErrorCarousel algorithm spec", () => {
  it("should have correct ML Infra Level 6 metadata", () => {
    expect(lstmConstantErrorCarousel.id).toBe("lstm-constant-error-carousel");
    expect(lstmConstantErrorCarousel.isMlInfra).toBe(true);
    expect(lstmConstantErrorCarousel.mlInfraLevel).toBe(6);
    expect(lstmConstantErrorCarousel.categories).toContain("ml_recurrent_gates");
    expect(lstmConstantErrorCarousel.defaultInput).toEqual(
      DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
    );
  });

  it("should compute correct LSTM CEC step gate activations and updated states", () => {
    const steps = generateLstmConstantErrorCarouselSteps(
      DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(22);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.["c_t[0]"]).toBeCloseTo(2.145, 2);
    expect(distTable?.["h_t[0]"]).toBeCloseTo(0.711, 2);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(2);
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
