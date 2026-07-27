import { describe, it, expect } from "vitest";
import {
  kvCacheStepAppend,
  DEFAULT_KVCACHESTEPAPPEND_INPUT,
  generateKvCacheStepAppendSteps,
} from "./kvCacheStepAppend";

describe("kv-cache-step-append (Autoregressive KV-Cache Step Append)", () => {
  it("should have correct metadata", () => {
    expect(kvCacheStepAppend.id).toBe("kv-cache-step-append");
    expect(kvCacheStepAppend.isMlInfra).toBe(true);
    expect(kvCacheStepAppend.mlInfraLevel).toBe(7);
    expect(kvCacheStepAppend.mlInfraCategory).toBe("ml_attention_geometry");
    expect(kvCacheStepAppend.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateKvCacheStepAppendSteps(DEFAULT_KVCACHESTEPAPPEND_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Autoregressive KV-Cache Step Append");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
