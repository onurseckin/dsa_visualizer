import { describe, it, expect } from "vitest";
import { tritonL2CacheSwizzledGemmScheduler, DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT, generateTritonL2CacheSwizzledGemmSchedulerSteps } from "./tritonL2CacheSwizzledGemmScheduler";

describe("triton-l2-cache-swizzled-gemm-scheduler (Triton L2 Cache Swizzled GEMM Tile Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(tritonL2CacheSwizzledGemmScheduler.id).toBe("triton-l2-cache-swizzled-gemm-scheduler");
    expect(tritonL2CacheSwizzledGemmScheduler.isMlInfra).toBe(true);
    expect(tritonL2CacheSwizzledGemmScheduler.mlInfraLevel).toBe(10);
    expect(tritonL2CacheSwizzledGemmScheduler.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tritonL2CacheSwizzledGemmScheduler.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonL2CacheSwizzledGemmSchedulerSteps(DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton L2 Cache Swizzled GEMM Tile Scheduler");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
