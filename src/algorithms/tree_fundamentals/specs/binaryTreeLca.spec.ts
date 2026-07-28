import { describe, expect, it } from "vitest";
import {
  binaryTreeLca,
  DEFAULT_BINARY_TREE_LCA_INPUT,
  generateBinaryTreeLcaSteps,
} from "../binaryTreeLca";

describe("binaryTreeLca algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(binaryTreeLca.id).toBe("binary-tree-lca");
    expect(binaryTreeLca.title).toBe("Lowest Common Ancestor of a Binary Tree");
    expect(binaryTreeLca.topicIds).toContain("tree_fundamentals");
    expect(binaryTreeLca.difficulty).toBe("Medium");
    expect(binaryTreeLca.defaultInput).toEqual(DEFAULT_BINARY_TREE_LCA_INPUT);
    expect(binaryTreeLca.constraints).toBeDefined();
    expect(binaryTreeLca.examples).toBeDefined();
  });

  it("should produce >= 20 steps for default input and all examples", () => {
    const defaultSteps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    expect(defaultSteps.length).toBeGreaterThanOrEqual(20);

    for (const example of binaryTreeLca.examples!) {
      const steps = generateBinaryTreeLcaSteps(
        example.input as typeof DEFAULT_BINARY_TREE_LCA_INPUT,
      );
      expect(steps.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("should have valid 1-indexed codeLine within 1..N for defaultInput and all examples", () => {
    const numLines = binaryTreeLca.code.split("\n").length;
    const defaultSteps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    for (const step of defaultSteps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(numLines);
    }

    for (const example of binaryTreeLca.examples!) {
      const steps = generateBinaryTreeLcaSteps(
        example.input as typeof DEFAULT_BINARY_TREE_LCA_INPUT,
      );
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(numLines);
      }
    }
  });

  it("should have lineExplanations for all lines in code", () => {
    const lines = binaryTreeLca.code.split("\n");
    const trivia = binaryTreeLca.trivia;
    expect(trivia?.lineExplanations).toBeDefined();
    for (let i = 1; i <= lines.length; i++) {
      expect(trivia?.lineExplanations?.[i]).toBeDefined();
      expect(typeof trivia?.lineExplanations?.[i]).toBe("string");
    }
  });

  it("should generate steps and find LCA of nodes 5 and 1 as node 3", () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.variables.p).toBe(5);
    expect(firstStep.variables.q).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.lcaVal).toBe(3);

    const snapshot = lastStep.primarySnapshot;
    expect(snapshot.kind).toBe("tree");
    if (snapshot.kind === "tree") {
      expect(snapshot.nodes).toHaveLength(9);
      const lcaNode = snapshot.nodes.find((n) => n.id === "3");
      expect(lcaNode?.state).toBe("sorted");
    }
  });

  it("should find LCA when one node is the ancestor of the other", () => {
    const input = {
      ...DEFAULT_BINARY_TREE_LCA_INPUT,
      pVal: 5,
      qVal: 4,
    };
    const steps = generateBinaryTreeLcaSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.lcaVal).toBe(5);
  });

  it("should handle small binary tree", () => {
    const input = {
      rootId: "10",
      pVal: 20,
      qVal: 30,
      nodes: [
        { id: "10", val: 10, leftId: "20", rightId: "30", state: "default" as const },
        { id: "20", val: 20, state: "default" as const },
        { id: "30", val: 30, state: "default" as const },
      ],
    };
    const steps = generateBinaryTreeLcaSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.lcaVal).toBe(10);
  });

  it("should handle non-existent root or missing nodes in tree", () => {
    const input = {
      rootId: "missing-root",
      pVal: 100,
      qVal: 200,
      nodes: [],
    };
    const steps = generateBinaryTreeLcaSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.lcaVal).toBe("None");
  });

  it("should handle tree where targets do not exist and nodes have missing child values or explicit state", () => {
    const input = {
      rootId: "1",
      pVal: 999,
      qVal: 888,
      nodes: [
        { id: "1", val: 1, leftId: "2", rightId: "3", state: "default" as const },
        { id: "2", val: 2, leftId: "dangling-left", state: "default" as const },
        { id: "3", val: 3, rightId: "dangling-right", state: "default" as const },
      ],
    };
    const steps = generateBinaryTreeLcaSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("should handle tree with missing lca node in nodeMap or unassigned node state", () => {
    const input = {
      rootId: "1",
      pVal: 2,
      qVal: 2,
      nodes: [
        { id: "1", val: 1, leftId: "2", state: "default" as const },
        { id: "2", val: 2, state: "default" as const },
      ],
    };
    const steps = generateBinaryTreeLcaSteps(input);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });
});
