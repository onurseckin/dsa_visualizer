import { describe, expect, it } from "vitest";
import {
  treeDiameter,
  DEFAULT_TREE_DIAMETER_INPUT,
  generateTreeDiameterSteps,
} from "../treeDiameter";
import type { TreeVisualSnapshot } from "../../../types/dsa";

describe("treeDiameter algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(treeDiameter.id).toBe("tree-diameter");
    expect(treeDiameter.title).toBe("Tree Diameter (2-DFS Algorithm)");
    expect(treeDiameter.category).toBe("tree_queries_and_diameter");
    expect(treeDiameter.difficulty).toBe("Medium");
    expect(treeDiameter.defaultInput).toEqual(DEFAULT_TREE_DIAMETER_INPUT);
  });

  it("should generate steps and compute correct tree diameter for default input", () => {
    const steps = generateTreeDiameterSteps(DEFAULT_TREE_DIAMETER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.diameter).toBe(6);

    const snapshot = lastStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.kind).toBe("tree");
    expect(snapshot.nodes).toHaveLength(8);

    // Sorted nodes belong to the diameter path
    const sortedNodes = snapshot.nodes.filter((n) => n.state === "sorted");
    expect(sortedNodes.length).toBe(7);
  });

  it("should handle a linear chain tree correctly", () => {
    const input = {
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "2", state: "default" as const },
        { id: "2", val: 2, leftId: "3", state: "default" as const },
        { id: "3", val: 3, state: "default" as const },
      ],
    };
    const steps = generateTreeDiameterSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.diameter).toBe(2);
  });

  it("should handle a single node tree", () => {
    const input = {
      rootId: "1",
      nodes: [{ id: "1", val: 1, state: "default" as const }],
    };
    const steps = generateTreeDiameterSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.diameter).toBe(0);
  });

  it("should handle tree with missing rootId in nodes", () => {
    const input = {
      rootId: "missing-root",
      nodes: [],
    };
    const steps = generateTreeDiameterSteps(input);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("should handle tree with dangling left/right IDs, missing values, and unassigned node states", () => {
    const input = {
      rootId: "1",
      nodes: [
        { id: "1", val: 1, leftId: "dangling-left", rightId: "2", state: "default" as const },
        { id: "2", val: 2, leftId: "3", rightId: "dangling-right", state: "default" as const },
        { id: "3", val: 3, state: "default" as const },
        { id: "4", val: 4, state: "default" as const }, // disconnected node
      ],
    };
    const steps = generateTreeDiameterSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.diameter).toBe(2);
  });
});
