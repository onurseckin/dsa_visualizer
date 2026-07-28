import { describe, expect, it } from "vitest";
import {
  viterbiSubwordSegmenter,
  DEFAULT_VITERBI_SUBWORD_INPUT,
  generateViterbiSubwordSegmenterSteps,
} from "../viterbiSubwordSegmenter";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("viterbiSubwordSegmenter algorithm spec", () => {
  it("should have correct ML Infra Level 5 metadata", () => {
    expect(viterbiSubwordSegmenter.id).toBe("viterbi-subword-segmenter");
    expect(viterbiSubwordSegmenter.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(viterbiSubwordSegmenter.topicIds).toContain("ml_tokenization");
    expect(viterbiSubwordSegmenter.defaultInput).toEqual(DEFAULT_VITERBI_SUBWORD_INPUT);
    expect(viterbiSubwordSegmenter.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" },
    ]);
  });

  it("should compute optimal Viterbi subword segmentation for 'unbreakable'", () => {
    const steps = generateViterbiSubwordSegmenterSteps(DEFAULT_VITERBI_SUBWORD_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(26);

    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.TotalLogProb).toBe(-3.8);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
    expect(snap.elements.length).toBe(3);
    expect(lastStep.variables.tokensJoined).toBe("un | break | able");
  });

  it("should return empty list when segmentation fails due to missing vocab tokens", () => {
    const inputOov = {
      text: "xyz",
      vocabScores: { a: -1.0, b: -1.0 },
    };
    const steps = generateViterbiSubwordSegmenterSteps(inputOov);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.elements.length).toBe(0);
  });
});

describe("viterbiSubwordSegmenter trivia metadata", () => {
  const meta = viterbiSubwordSegmenter.trivia;
  const lines = viterbiSubwordSegmenter.code.replace(/\s+$/, "").split("\n");

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
