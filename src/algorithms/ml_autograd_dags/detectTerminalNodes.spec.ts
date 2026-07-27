import { describe, it, expect } from "vitest";
import {
  detectTerminalNodes,
  DEFAULT_DETECTTERMINALNODES_INPUT,
  generateDetectTerminalNodesSteps,
} from "./detectTerminalNodes";

describe("detect-terminal-nodes (Detect Terminal Leaf Nodes in DAG)", () => {
  it("should have correct metadata", () => {
    expect(detectTerminalNodes.id).toBe("detect-terminal-nodes");
    expect(detectTerminalNodes.isMlInfra).toBe(true);
    expect(detectTerminalNodes.mlInfraLevel).toBe(3);
    expect(detectTerminalNodes.mlInfraCategory).toBe("ml_autograd_dags");
    expect(detectTerminalNodes.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDetectTerminalNodesSteps(DEFAULT_DETECTTERMINALNODES_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Detect Terminal Leaf Nodes in DAG");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
