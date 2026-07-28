import { describe, it, expect } from "vitest";
import {
  detectTerminalNodes,
  DEFAULT_DETECTTERMINALNODES_INPUT,
  generateDetectTerminalNodesSteps,
} from "./detectTerminalNodes";

describe("detect-terminal-nodes (Detect Terminal Leaf Nodes in DAG)", () => {
  it("should have correct metadata", () => {
    expect(detectTerminalNodes.id).toBe("detect-terminal-nodes");
    expect(detectTerminalNodes.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(detectTerminalNodes.topicIds).toContain("ml_autograd_dags");
    expect(detectTerminalNodes.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDetectTerminalNodesSteps(DEFAULT_DETECTTERMINALNODES_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Terminal Sink Node Detector");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = detectTerminalNodes.code.trim().split("\n").length;
    expect(detectTerminalNodes.trivia).toBeDefined();
    expect(detectTerminalNodes.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = detectTerminalNodes.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = detectTerminalNodes.code.trim().split("\n").length;
    const steps = generateDetectTerminalNodesSteps(DEFAULT_DETECTTERMINALNODES_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
