import { describe, it, expect } from "vitest";
import {
  findZeroIndegreeNodes,
  DEFAULT_FINDZEROINDEGREENODES_INPUT,
  generateFindZeroIndegreeNodesSteps,
} from "./findZeroIndegreeNodes";

describe("find-zero-indegree-nodes (Find Zero In-Degree Root Input Nodes)", () => {
  it("should have correct metadata", () => {
    expect(findZeroIndegreeNodes.id).toBe("find-zero-indegree-nodes");
    expect(findZeroIndegreeNodes.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(findZeroIndegreeNodes.topicIds).toContain("ml_autograd_dags");
    expect(findZeroIndegreeNodes.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFindZeroIndegreeNodesSteps(DEFAULT_FINDZEROINDEGREENODES_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Zero In-Degree Root Input Node Detector");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = findZeroIndegreeNodes.code.trim().split("\n").length;
    expect(findZeroIndegreeNodes.trivia).toBeDefined();
    expect(findZeroIndegreeNodes.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = findZeroIndegreeNodes.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = findZeroIndegreeNodes.code.trim().split("\n").length;
    const steps = generateFindZeroIndegreeNodesSteps(DEFAULT_FINDZEROINDEGREENODES_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
