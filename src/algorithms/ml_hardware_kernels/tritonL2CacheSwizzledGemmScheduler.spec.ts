import { describe, it, expect } from "vitest";
import { tritonL2CacheSwizzledGemmScheduler } from "./tritonL2CacheSwizzledGemmScheduler";

describe("tritonL2CacheSwizzledGemmScheduler", () => {
  it("should have valid metadata", () => {
    expect(tritonL2CacheSwizzledGemmScheduler.id).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.title).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.code).toBeDefined();
    expect(tritonL2CacheSwizzledGemmScheduler.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tritonL2CacheSwizzledGemmScheduler.generateSteps(
      tritonL2CacheSwizzledGemmScheduler.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
