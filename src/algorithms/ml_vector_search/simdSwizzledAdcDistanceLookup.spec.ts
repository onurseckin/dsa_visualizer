import { describe, it, expect } from "vitest";
import { simdSwizzledAdcDistanceLookup } from "./simdSwizzledAdcDistanceLookup";

describe("simdSwizzledAdcDistanceLookup", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(simdSwizzledAdcDistanceLookup).toBeDefined();
    expect(simdSwizzledAdcDistanceLookup.id).toBe("simdSwizzledAdcDistanceLookup");
    expect(simdSwizzledAdcDistanceLookup.isMlInfra).toBe(true);
    expect(simdSwizzledAdcDistanceLookup.mlInfraLevel).toBe(5);
    expect(simdSwizzledAdcDistanceLookup.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = simdSwizzledAdcDistanceLookup.generateSteps(simdSwizzledAdcDistanceLookup.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
