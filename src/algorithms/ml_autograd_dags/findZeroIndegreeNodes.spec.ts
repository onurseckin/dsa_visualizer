import { describe, it, expect } from "vitest";
import { findZeroIndegreeNodes, DEFAULT_FINDZEROINDEGREENODES_INPUT, generateFindZeroIndegreeNodesSteps } from "./findZeroIndegreeNodes";

describe("find-zero-indegree-nodes (Find Zero In-Degree Root Input Nodes)", () => {
  it("should have correct metadata", () => {
    expect(findZeroIndegreeNodes.id).toBe("find-zero-indegree-nodes");
    expect(findZeroIndegreeNodes.isMlInfra).toBe(true);
    expect(findZeroIndegreeNodes.mlInfraLevel).toBe(3);
    expect(findZeroIndegreeNodes.mlInfraCategory).toBe("ml_autograd_dags");
    expect(findZeroIndegreeNodes.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFindZeroIndegreeNodesSteps(DEFAULT_FINDZEROINDEGREENODES_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Find Zero In-Degree Root Input Nodes");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
