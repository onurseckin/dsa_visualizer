import { describe, it, expect } from "vitest";
import { asyncDoubleBufferingPipeline, DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT, generateAsyncDoubleBufferingPipelineSteps } from "./asyncDoubleBufferingPipeline";

describe("async-double-buffering-pipeline (Async Double-Buffering Copy Pipeline)", () => {
  it("should have correct metadata", () => {
    expect(asyncDoubleBufferingPipeline.id).toBe("async-double-buffering-pipeline");
    expect(asyncDoubleBufferingPipeline.isMlInfra).toBe(true);
    expect(asyncDoubleBufferingPipeline.mlInfraLevel).toBe(2);
    expect(asyncDoubleBufferingPipeline.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(asyncDoubleBufferingPipeline.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAsyncDoubleBufferingPipelineSteps(DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Async Double-Buffering Copy Pipeline");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
