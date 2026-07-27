import { describe, expect, it } from "vitest";
import {
  dijkstraShortestPath,
  DEFAULT_DIJKSTRA_INPUT,
  generateDijkstraSteps,
  type DijkstraInput,
} from "../dijkstraShortestPath";

describe("dijkstraShortestPath logic spec", () => {
  it("should have correct algorithm metadata", () => {
    expect(dijkstraShortestPath.id).toBe("dijkstra-shortest-path");
    expect(dijkstraShortestPath.category).toBe("graph_shortest_paths");
    expect(dijkstraShortestPath.difficulty).toBe("Medium");
    expect(dijkstraShortestPath.code).toContain("def dijkstra");
    expect(dijkstraShortestPath.defaultInput).toEqual(DEFAULT_DIJKSTRA_INPUT);
  });

  it("should compute shortest path distances correctly", () => {
    const input = {
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 2 },
        { from: "B", to: "C", weight: 3 },
        { from: "A", to: "C", weight: 10 },
      ],
      startNode: "A",
    };
    const steps = generateDijkstraSteps(input);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(5);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.distanceTable?.["C"]).toBe(5);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === "graph") {
      expect(snapshot.kind).toBe("graph");
      expect(snapshot.nodes.length).toBe(3);
    }
  });

  it("should generate steps for default input", () => {
    const steps = generateDijkstraSteps(DEFAULT_DIJKSTRA_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("completed");
    expect(lastStep.auxiliaryState.distanceTable?.["E"]).toBe(11);
  });

  it("maps every non-blank code line in lineExplanations", () => {
    const meta = dijkstraShortestPath.trivia;
    const lines = dijkstraShortestPath.code.replace(/\s+$/, "").split("\n");
    expect(meta?.lineExplanations).toBeDefined();

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim().length > 0) {
        expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
        expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      }
    });
  });

  it("should handle empty input graph gracefully", () => {
    const emptyInput = { nodes: [], edges: [], startNode: "" };
    const steps = generateDijkstraSteps(emptyInput);
    expect(steps.length).toBe(1);
    expect(steps[0].explanation.what).toContain("Initialize");

    const stepsFallback = generateDijkstraSteps({} as DijkstraInput);
    expect(stepsFallback.length).toBeGreaterThan(0);
  });
});
