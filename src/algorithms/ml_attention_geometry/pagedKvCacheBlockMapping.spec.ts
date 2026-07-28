import { describe, it, expect } from "vitest";
import {
  pagedKvCacheBlockMapping,
  DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT,
  generatePagedKvCacheBlockMappingSteps,
  PAGEDKVCACHEBLOCKMAPPING_CODE,
} from "./pagedKvCacheBlockMapping";

describe("paged-kv-cache-block-mapping (Paged KV-Cache Block Table Mapper)", () => {
  it("should have correct metadata", () => {
    expect(pagedKvCacheBlockMapping.id).toBe("paged-kv-cache-block-mapping");
    expect(pagedKvCacheBlockMapping.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(pagedKvCacheBlockMapping.topicIds).toContain("ml_attention_geometry");
    expect(pagedKvCacheBlockMapping.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generatePagedKvCacheBlockMappingSteps(DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize Paged KV-Cache Block Table Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = PAGEDKVCACHEBLOCKMAPPING_CODE.trim().split("\n");
    const lineExplanations = pagedKvCacheBlockMapping.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
