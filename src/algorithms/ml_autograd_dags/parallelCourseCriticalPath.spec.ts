import { describe, it, expect } from "vitest";
import {
  parallelCourseCriticalPath,
  DEFAULT_PARALLELCOURSECRITICALPATH_INPUT,
  generateParallelCourseCriticalPathSteps,
} from "./parallelCourseCriticalPath";

describe("parallel-course-critical-path (Critical Path Latency Bounds in Computational Graph)", () => {
  it("should have correct metadata", () => {
    expect(parallelCourseCriticalPath.id).toBe("parallel-course-critical-path");
    expect(parallelCourseCriticalPath.isMlInfra).toBe(true);
    expect(parallelCourseCriticalPath.mlInfraLevel).toBe(3);
    expect(parallelCourseCriticalPath.mlInfraCategory).toBe("ml_autograd_dags");
    expect(parallelCourseCriticalPath.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateParallelCourseCriticalPathSteps(DEFAULT_PARALLELCOURSECRITICALPATH_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Critical Path Latency Bounds in Computational Graph",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
