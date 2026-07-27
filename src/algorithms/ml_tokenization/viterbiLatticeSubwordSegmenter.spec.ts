import { describe, it, expect } from "vitest";
import { viterbiLatticeSubwordSegmenter } from "./viterbiLatticeSubwordSegmenter";

describe("viterbiLatticeSubwordSegmenter", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(viterbiLatticeSubwordSegmenter.id).toBe("viterbiLatticeSubwordSegmenter");
    expect(viterbiLatticeSubwordSegmenter.category).toBe("ml_tokenization");
    expect(viterbiLatticeSubwordSegmenter.isMlInfra).toBe(true);
    expect(viterbiLatticeSubwordSegmenter.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = viterbiLatticeSubwordSegmenter.generateSteps(viterbiLatticeSubwordSegmenter.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
