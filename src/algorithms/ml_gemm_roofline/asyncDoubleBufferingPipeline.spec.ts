import { describe, it, expect } from "vitest";
import {
  asyncDoubleBufferingPipeline,
  DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
  generateAsyncDoubleBufferingPipelineSteps,
  ASYNCDOUBLEBUFFERINGPIPELINE_CODE,
} from "./asyncDoubleBufferingPipeline";

describe("async-double-buffering-pipeline (Async Double-Buffering Copy Pipeline)", () => {
  it("should have correct metadata", () => {
    expect(asyncDoubleBufferingPipeline.id).toBe("async-double-buffering-pipeline");
    expect(asyncDoubleBufferingPipeline.isMlInfra).toBe(true);
    expect(asyncDoubleBufferingPipeline.mlInfraLevel).toBe(2);
    expect(asyncDoubleBufferingPipeline.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(asyncDoubleBufferingPipeline.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateAsyncDoubleBufferingPipelineSteps(
      DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Async Double-Buffering Copy Pipeline");
    expect(steps[steps.length - 1].explanation.what).toBe("Pipeline Execution Complete");

    // Verify all steps have kind: "matrix"
    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = ASYNCDOUBLEBUFFERINGPIPELINE_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = asyncDoubleBufferingPipeline.trivia.lineExplanations;

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
