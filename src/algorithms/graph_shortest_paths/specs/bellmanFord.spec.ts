import { describe, expect, it } from "vitest";
import { bellmanFord, DEFAULT_BELLMAN_FORD_INPUT, generateBellmanFordSteps } from "../bellmanFord";

describe("bellmanFord algorithm logic spec", () => {
  it("should have correct algorithm definition metadata", () => {
    expect(bellmanFord.id).toBe("bellman-ford");
    expect(bellmanFord.title).toBe("Bellman-Ford Shortest Path");
    expect(bellmanFord.category).toBe("graph_shortest_paths");
    expect(bellmanFord.difficulty).toBe("Medium");
    expect(bellmanFord.defaultInput).toEqual(DEFAULT_BELLMAN_FORD_INPUT);
    expect(bellmanFord.code).toContain("def bellman_ford");
  });

  it("should generate valid steps and compute shortest distances for default input", () => {
    const steps = generateBellmanFordSteps(DEFAULT_BELLMAN_FORD_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Bellman-Ford complete");
    expect(lastStep.variables.hasNegativeCycle).toBe(false);

    // Verify distance table for default graph:
    // S -> 0
    // S->B(2) -> B = 2
    // S->B(2)->A(1) = 3 (cheaper than S->A(4))
    // S->B(2)->A(1)->C(3) = 6 (cheaper than S->B(2)->C(5) = 7)
    // S->B(2)->A(1)->C(3)->D(-2) = 4 (cheaper than S->B(2)->D(4) = 6)
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.["S"]).toBe(0);
    expect(distTable?.["A"]).toBe(3);
    expect(distTable?.["B"]).toBe(2);
    expect(distTable?.["C"]).toBe(6);
    expect(distTable?.["D"]).toBe(4);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === "graph") {
      expect(snapshot.kind).toBe("graph");
      expect(snapshot.nodes.length).toBe(5);
    }
  });

  it("maps every non-blank code line in lineExplanations", () => {
    const meta = bellmanFord.trivia;
    const lines = bellmanFord.code.replace(/\s+$/, "").split("\n");
    expect(meta?.lineExplanations).toBeDefined();

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim().length > 0) {
        expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
        expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      }
    });
  });

  it("should detect negative weight cycles in a graph", () => {
    const cyclicInput = {
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: -2 },
        { from: "C", to: "A", weight: -1 }, // Cycle total weight = 1 - 2 - 1 = -2
      ],
      startNode: "A",
    };

    const steps = generateBellmanFordSteps(cyclicInput);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.hasNegativeCycle).toBe(true);
    expect(lastStep.explanation.what).toContain("negative cycle");
  });

  it("should handle empty input graph", () => {
    const emptyInput = { nodes: [], edges: [], startNode: "" };
    const steps = generateBellmanFordSteps(emptyInput);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");

    const stepsNull = generateBellmanFordSteps(
      {} as { nodes: string[]; edges: []; startNode: string },
    );
    expect(stepsNull.length).toBeGreaterThan(0);
  });

  it("should handle skip edge where both source and target distances are finite", () => {
    const input = {
      nodes: ["S", "A", "B"],
      edges: [
        { from: "S", to: "B", weight: 2 },
        { from: "B", to: "A", weight: 1 },
        { from: "S", to: "A", weight: 10 },
      ],
      startNode: "S",
    };
    const steps = generateBellmanFordSteps(input);
    expect(steps.length).toBeGreaterThan(0);

    const unreachableInput = {
      nodes: ["S", "U", "A"],
      edges: [
        { from: "U", to: "A", weight: 5 },
        { from: "S", to: "A", weight: 2 },
      ],
      startNode: "S",
    };
    const stepsUnreachable = generateBellmanFordSteps(unreachableInput);
    expect(stepsUnreachable.length).toBeGreaterThan(0);
  });
});
