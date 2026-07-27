import { describe, it, expect } from "vitest";
import { perChannelSymmetricQuantizer, DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT, generatePerChannelSymmetricQuantizerSteps } from "./perChannelSymmetricQuantizer";

describe("per-channel-symmetric-quantizer (Per-Channel Symmetric INT8 Quantizer)", () => {
  it("should have correct metadata", () => {
    expect(perChannelSymmetricQuantizer.id).toBe("per-channel-symmetric-quantizer");
    expect(perChannelSymmetricQuantizer.isMlInfra).toBe(true);
    expect(perChannelSymmetricQuantizer.mlInfraLevel).toBe(4);
    expect(perChannelSymmetricQuantizer.mlInfraCategory).toBe("ml_precision_quantization");
    expect(perChannelSymmetricQuantizer.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePerChannelSymmetricQuantizerSteps(DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Per-Channel Symmetric INT8 Quantizer");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
