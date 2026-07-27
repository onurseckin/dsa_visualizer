import { describe, it, expect } from "vitest";
import {
  perChannelSymmetricQuantizer,
  generatePerChannelSymmetricQuantizerSteps,
  DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
} from "./perChannelSymmetricQuantizer";

describe("Per Channel Symmetric Quantizer", () => {
  it("should have correct metadata", () => {
    expect(perChannelSymmetricQuantizer.id).toBe("per-channel-symmetric-quantizer");
    expect(perChannelSymmetricQuantizer.title).toBe("Per Channel Symmetric Quantizer");
    expect(perChannelSymmetricQuantizer.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generatePerChannelSymmetricQuantizerSteps(
      DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = perChannelSymmetricQuantizer.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = perChannelSymmetricQuantizer.code.split("\n");
    const lineExplanations = perChannelSymmetricQuantizer.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(perChannelSymmetricQuantizer.examples?.length).toBe(3);
  });
});
