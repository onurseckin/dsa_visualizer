import { describe, it, expect } from "vitest";
import { sentencepieceByteFallbackEncoder } from "./sentencepieceByteFallbackEncoder";

describe("sentencepiece-byte-fallback-encoder", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(sentencepieceByteFallbackEncoder.id).toBe("sentencepiece-byte-fallback-encoder");
    expect(sentencepieceByteFallbackEncoder.topicIds).toContain("ml_tokenization");
    expect(
      sentencepieceByteFallbackEncoder.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(sentencepieceByteFallbackEncoder.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = sentencepieceByteFallbackEncoder.generateSteps(
      sentencepieceByteFallbackEncoder.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
