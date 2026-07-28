import { describe, it, expect } from "vitest";
import { viterbiLatticeSubwordSegmenter } from "./viterbiLatticeSubwordSegmenter";

describe("viterbi-lattice-subword-segmenter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(viterbiLatticeSubwordSegmenter.id).toBe("viterbi-lattice-subword-segmenter");
    expect(viterbiLatticeSubwordSegmenter.topicIds).toContain("ml_tokenization");
    expect(
      viterbiLatticeSubwordSegmenter.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(viterbiLatticeSubwordSegmenter.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = viterbiLatticeSubwordSegmenter.generateSteps(
      viterbiLatticeSubwordSegmenter.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
