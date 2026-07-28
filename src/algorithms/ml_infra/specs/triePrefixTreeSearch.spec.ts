import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT,
  TRIE_PREFIX_TREE_SEARCH_CODE,
  generateTriePrefixTreeSearchSteps,
  triePrefixTreeSearch,
} from "../triePrefixTreeSearch";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("triePrefixTreeSearch algorithm spec", () => {
  it("should have correct ML Infra Level 5 metadata", () => {
    expect(triePrefixTreeSearch.id).toBe("trie-prefix-tree-search");
    expect(triePrefixTreeSearch.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(triePrefixTreeSearch.topicIds).toContain("ml_tokenization");
    expect(triePrefixTreeSearch.defaultInput).toEqual(DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT);
    expect(triePrefixTreeSearch.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" },
    ]);
  });

  it("should generate steps and build tree snapshot for default prefix search", () => {
    const steps = generateTriePrefixTreeSearchSteps(DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.complete).toBe(true);
    expect(lastStep.variables.matches).toBe(3);

    const snap = lastStep.primarySnapshot as TreeVisualSnapshot;
    expect(snap.kind).toBe("tree");
    expect(snap.nodes.length).toBeGreaterThan(0);
  });

  it("should return early when prefix is absent", () => {
    const steps = generateTriePrefixTreeSearchSteps({
      words: ["cat", "dog"],
      searchPrefix: "z",
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.found).toBe(false);
  });
});

describe("triePrefixTreeSearch trivia metadata", () => {
  const meta = triePrefixTreeSearch.trivia;
  const lines = TRIE_PREFIX_TREE_SEARCH_CODE.replace(/\s+$/, "").split("\n");

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
