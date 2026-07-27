import { describe, it, expect } from "vitest";
import {
  pagedKvCacheBlockMapping,
  DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT,
  generatePagedKvCacheBlockMappingSteps,
} from "./pagedKvCacheBlockMapping";

describe("paged-kv-cache-block-mapping (Paged KV-Cache Block Table Mapper)", () => {
  it("should have correct metadata", () => {
    expect(pagedKvCacheBlockMapping.id).toBe("paged-kv-cache-block-mapping");
    expect(pagedKvCacheBlockMapping.isMlInfra).toBe(true);
    expect(pagedKvCacheBlockMapping.mlInfraLevel).toBe(7);
    expect(pagedKvCacheBlockMapping.mlInfraCategory).toBe("ml_attention_geometry");
    expect(pagedKvCacheBlockMapping.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePagedKvCacheBlockMappingSteps(DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Paged KV-Cache Block Table Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
