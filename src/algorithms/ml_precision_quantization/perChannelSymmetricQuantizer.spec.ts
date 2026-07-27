import { describe, it, expect } from "vitest";
import {
  perChannelSymmetricQuantizer,
  generatePerChannelSymmetricQuantizerSteps,
  DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
} from "./perChannelSymmetricQuantizer";

describe("Per Channel Symmetric Quantizer", () => {
  it("should have correct metadata", () => {
    expect(perChannelSymmetricQuantizer.id).toBeDefined();
    expect(perChannelSymmetricQuantizer.title).toBe("Per Channel Symmetric Quantizer");
    expect(perChannelSymmetricQuantizer.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generatePerChannelSymmetricQuantizerSteps(
      DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(perChannelSymmetricQuantizer.examples?.length).toBe(3);
  });
});
