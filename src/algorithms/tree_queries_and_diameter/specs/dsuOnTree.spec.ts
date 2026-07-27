import { describe, expect, it } from "vitest";
import {
  DEFAULT_DSU_ON_TREE_INPUT,
  dsuOnTree,
  generateDsuOnTreeSteps,
} from "../dsuOnTree";

describe("dsuOnTree algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(dsuOnTree.id).toBe("dsu-on-tree");
    expect(dsuOnTree.title).toBe("DSU on Tree (Sack / Small-to-Large)");
    expect(dsuOnTree.category).toBe("tree_queries_and_diameter");
    expect(dsuOnTree.difficulty).toBe("Hard");
    expect(dsuOnTree.defaultInput).toEqual(DEFAULT_DSU_ON_TREE_INPUT);
  });

  it("should generate steps and produce >= 20 steps for default input", () => {
    const steps = generateDsuOnTreeSteps(DEFAULT_DSU_ON_TREE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(50);
    expect(lastStep.variables.completed).toBe(true);
  });

  it("should handle single node tree boundary case", () => {
    const input = {
      numNodes: 1,
      edges: [] as [number, number][],
      colors: [42],
    };
    const steps = generateDsuOnTreeSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);
  });
});
