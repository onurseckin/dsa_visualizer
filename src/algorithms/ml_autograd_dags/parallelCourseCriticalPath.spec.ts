import { describe, it, expect } from "vitest";
import {
  parallelCourseCriticalPath,
  DEFAULT_PARALLELCOURSECRITICALPATH_INPUT,
  generateParallelCourseCriticalPathSteps,
} from "./parallelCourseCriticalPath";

describe("parallel-course-critical-path (Critical Path Latency Bounds in Computational Graph)", () => {
  it("should have correct metadata", () => {
    expect(parallelCourseCriticalPath.id).toBe("parallel-course-critical-path");
    expect(parallelCourseCriticalPath.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(parallelCourseCriticalPath.topicIds).toContain("ml_autograd_dags");
    expect(parallelCourseCriticalPath.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateParallelCourseCriticalPathSteps(DEFAULT_PARALLELCOURSECRITICALPATH_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Critical Path Latency Bounds Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = parallelCourseCriticalPath.code.trim().split("\n").length;
    expect(parallelCourseCriticalPath.trivia).toBeDefined();
    expect(parallelCourseCriticalPath.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = parallelCourseCriticalPath.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = parallelCourseCriticalPath.code.trim().split("\n").length;
    const steps = generateParallelCourseCriticalPathSteps(DEFAULT_PARALLELCOURSECRITICALPATH_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
