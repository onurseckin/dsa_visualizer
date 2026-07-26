import { describe, expect, it } from "vitest";
import {
  fordFulkerson,
  DEFAULT_FORD_FULKERSON_INPUT,
  generateFordFulkersonSteps,
  type FordFulkersonInput,
} from "../fordFulkerson";

describe("fordFulkerson algorithm logic spec", () => {
  it("should have correct algorithm definition metadata", () => {
    expect(fordFulkerson.id).toBe("ford-fulkerson");
    expect(fordFulkerson.title).toBe("Ford-Fulkerson Maximum Flow");
    expect(fordFulkerson.category).toBe("graph_flows_and_cuts");
    expect(fordFulkerson.difficulty).toBe("Hard");
    expect(fordFulkerson.defaultInput).toEqual(DEFAULT_FORD_FULKERSON_INPUT);
    expect(fordFulkerson.code).toContain("def ford_fulkerson");
  });

  it("should generate valid steps and compute max flow for default input", () => {
    const steps = generateFordFulkersonSteps(DEFAULT_FORD_FULKERSON_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("no augmenting path remains");
    expect(lastStep.variables.maxFlow).toBe(20);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === "graph") {
      expect(snapshot.kind).toBe("graph");
      expect(snapshot.nodes.length).toBe(4);
      expect(snapshot.edges.length).toBe(5);
      expect(snapshot.nodes[0].x).toBe(80);
      expect(snapshot.nodes[3].x).toBe(440);
    }
  });

  it("should handle graph with zero capacity or no path from source to sink", () => {
    const noPathInput = {
      nodes: ["S", "A", "T"],
      edges: [
        { from: "S", to: "A", capacity: 10 },
        { from: "T", to: "A", capacity: 10 }, // No edge into T
      ],
      source: "S",
      sink: "T",
    };

    const steps = generateFordFulkersonSteps(noPathInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.maxFlow).toBe(0);
    expect(lastStep.explanation.what).toContain("no augmenting path remains");
  });

  it("should handle empty input graph", () => {
    const emptyInput = { nodes: [], edges: [], source: "", sink: "" };
    const steps = generateFordFulkersonSteps(emptyInput);
    expect(steps.length).toBe(1);
    expect(steps[0].explanation.what).toContain("empty network");

    const stepsNull = generateFordFulkersonSteps({} as FordFulkersonInput);
    expect(stepsNull.length).toBe(1);
  });

  it("should handle custom node names with automatic circular positioning and backward edges", () => {
    const inputCustom = {
      nodes: ["Node1", "Node2", "Node3", "Node4"],
      edges: [
        { from: "Node1", to: "Node2", capacity: 10 },
        { from: "Node1", to: "Node3", capacity: 10 },
        { from: "Node2", to: "Node3", capacity: 10 },
        { from: "Node2", to: "Node4", capacity: 10 },
        { from: "Node3", to: "Node4", capacity: 10 },
      ],
      source: "Node1",
      sink: "Node4",
    };

    const steps = generateFordFulkersonSteps(inputCustom);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.maxFlow).toBe(20);

    const backwardEdgeInput = {
      nodes: ["S", "A", "B", "T"],
      edges: [
        { from: "S", to: "A", capacity: 10 },
        { from: "A", to: "B", capacity: 10 },
        { from: "B", to: "T", capacity: 10 },
        { from: "S", to: "B", capacity: 10 },
        { from: "A", to: "T", capacity: 10 },
      ],
      source: "S",
      sink: "T",
    };
    const stepsBackward = generateFordFulkersonSteps(backwardEdgeInput);
    expect(stepsBackward[stepsBackward.length - 1].variables.maxFlow).toBe(20);

    const deadEndInput = {
      nodes: ["S", "DeadEnd", "T"],
      edges: [
        { from: "S", to: "DeadEnd", capacity: 10 },
        { from: "S", to: "T", capacity: 10 },
      ],
      source: "S",
      sink: "T",
    };
    const stepsDeadEnd = generateFordFulkersonSteps(deadEndInput);
    expect(stepsDeadEnd[stepsDeadEnd.length - 1].variables.maxFlow).toBe(10);
  });
});
