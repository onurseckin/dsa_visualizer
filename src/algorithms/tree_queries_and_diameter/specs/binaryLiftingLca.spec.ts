import { describe, expect, it } from "vitest";
import {
  DEFAULT_BINARY_LIFTING_LCA_INPUT,
  binaryLiftingLca,
  generateBinaryLiftingLcaSteps,
} from "../binaryLiftingLca";

describe("binaryLiftingLca algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(binaryLiftingLca.id).toBe("binary-lifting-lca");
    expect(binaryLiftingLca.title).toBe("Binary Lifting for LCA");
    expect(binaryLiftingLca.topicIds).toContain("tree_fundamentals");
    expect(binaryLiftingLca.difficulty).toBe("Hard");
    expect(binaryLiftingLca.defaultInput).toEqual(DEFAULT_BINARY_LIFTING_LCA_INPUT);
  });

  it("should generate steps and produce >= 20 steps for default input", () => {
    const steps = generateBinaryLiftingLcaSteps(DEFAULT_BINARY_LIFTING_LCA_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(3);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(41);
    expect(lastStep.variables.lca).toBe(1);
  });

  it("should handle ancestor-descendant query boundary case", () => {
    const input = {
      numNodes: 7,
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ] as [number, number][],
      query: [1, 3] as [number, number],
    };
    const steps = generateBinaryLiftingLcaSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.lca).toBe(1);
  });
});
