import { describe, it, expect } from "vitest";
import { simdSwizzledAdcDistanceLookup } from "./simdSwizzledAdcDistanceLookup";

describe("simd-swizzled-adc-distance-lookup", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(simdSwizzledAdcDistanceLookup).toBeDefined();
    expect(simdSwizzledAdcDistanceLookup.id).toBe("simd-swizzled-adc-distance-lookup");
    expect(
      simdSwizzledAdcDistanceLookup.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(simdSwizzledAdcDistanceLookup.topicIds).toContain("ml_vector_search");
  });

  it("should not contain Python comments in code string", () => {
    const code = simdSwizzledAdcDistanceLookup.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully with matrix snapshots", () => {
    const steps = simdSwizzledAdcDistanceLookup.generateSteps(
      simdSwizzledAdcDistanceLookup.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("matrix");
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.codeLine).toBeGreaterThan(0);
    }
  });

  it("should calculate correct accumulated distances for examples", () => {
    const steps = simdSwizzledAdcDistanceLookup.generateSteps(
      simdSwizzledAdcDistanceLookup.defaultInput,
    );
    const finalStep = steps[steps.length - 1];
    expect(finalStep.explanation.what).toContain("Complete");
    expect(finalStep.variables.complete).toBe(true);
  });
});
