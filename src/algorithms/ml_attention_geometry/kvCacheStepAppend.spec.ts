import { describe, it, expect } from "vitest";
import {
  kvCacheStepAppend,
  DEFAULT_KVCACHESTEPAPPEND_INPUT,
  generateKvCacheStepAppendSteps,
  KVCACHESTEPAPPEND_CODE,
} from "./kvCacheStepAppend";

describe("kv-cache-step-append (Autoregressive KV-Cache Step Append)", () => {
  it("should have correct metadata", () => {
    expect(kvCacheStepAppend.id).toBe("kv-cache-step-append");
    expect(kvCacheStepAppend.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(kvCacheStepAppend.topicIds).toContain("ml_attention_geometry");
    expect(kvCacheStepAppend.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateKvCacheStepAppendSteps(DEFAULT_KVCACHESTEPAPPEND_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize Autoregressive KV-Cache Step Append");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = KVCACHESTEPAPPEND_CODE.trim().split("\n");
    const lineExplanations = kvCacheStepAppend.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
