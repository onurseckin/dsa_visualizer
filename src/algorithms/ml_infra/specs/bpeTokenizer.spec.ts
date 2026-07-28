import { describe, expect, it } from "vitest";
import {
  bpeTokenizer,
  DEFAULT_BPE_TOKENIZER_INPUT,
  generateBpeTokenizerSteps,
} from "../bpeTokenizer";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("bpeTokenizer algorithm spec", () => {
  it("should have correct ML Infra Level 5 metadata", () => {
    expect(bpeTokenizer.id).toBe("bpe-tokenizer");
    expect(bpeTokenizer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(bpeTokenizer.topicIds).toContain("ml_tokenization");
    expect(bpeTokenizer.defaultInput).toEqual(DEFAULT_BPE_TOKENIZER_INPUT);
    expect(bpeTokenizer.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" },
    ]);
  });

  it("should generate steps and execute BPE merges for default input", () => {
    const steps = generateBpeTokenizerSteps(DEFAULT_BPE_TOKENIZER_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(38);
    expect(lastStep.variables.mergesExecuted).toBeGreaterThan(0);

    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe("array");
  });

  it("should learn subword prefix 'low' for complex corpus", () => {
    const customInput = {
      text: "low lower newest lowest",
      numMerges: 4,
    };
    const steps = generateBpeTokenizerSteps(customInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.mergesExecuted).toBeGreaterThanOrEqual(2);
  });

  it("should halt early with 0 merges when all characters are unique", () => {
    const uniqueInput = {
      text: "a b c d",
      numMerges: 3,
    };
    const steps = generateBpeTokenizerSteps(uniqueInput);
    const stopStep = steps.find((s) => s.codeLine === 17);
    expect(stopStep).toBeDefined();
    expect(stopStep?.variables.maxCount).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.mergesExecuted).toBe(0);
  });
});

describe("bpeTokenizer trivia metadata", () => {
  const meta = bpeTokenizer.trivia;
  const lines = bpeTokenizer.code.replace(/\s+$/, "").split("\n");

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
