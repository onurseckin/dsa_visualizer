import { describe, it, expect } from "vitest";
import { sentencepieceByteFallbackEncoder } from "./sentencepieceByteFallbackEncoder";

describe("sentencepieceByteFallbackEncoder", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(sentencepieceByteFallbackEncoder.id).toBe("sentencepieceByteFallbackEncoder");
    expect(sentencepieceByteFallbackEncoder.category).toBe("ml_tokenization");
    expect(sentencepieceByteFallbackEncoder.isMlInfra).toBe(true);
    expect(sentencepieceByteFallbackEncoder.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = sentencepieceByteFallbackEncoder.generateSteps(
      sentencepieceByteFallbackEncoder.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
