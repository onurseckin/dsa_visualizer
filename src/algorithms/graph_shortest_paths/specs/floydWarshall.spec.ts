import { describe, expect, it } from "vitest";
import {
  floydWarshall,
  DEFAULT_FLOYD_WARSHALL_INPUT,
  generateFloydWarshallSteps,
} from "../floydWarshall";

describe("floydWarshall algorithm logic spec", () => {
  it("should have correct algorithm definition metadata", () => {
    expect(floydWarshall.id).toBe("floyd-warshall");
    expect(floydWarshall.title).toBe("Floyd-Warshall All-Pairs Shortest Path");
    expect(floydWarshall.category).toBe("graph_shortest_paths");
    expect(floydWarshall.difficulty).toBe("Medium");
    expect(floydWarshall.defaultInput).toEqual(DEFAULT_FLOYD_WARSHALL_INPUT);
    expect(floydWarshall.code).toContain("def floyd_warshall");
  });

  it("should generate valid steps and compute all-pairs distances for default input", () => {
    const steps = generateFloydWarshallSteps(DEFAULT_FLOYD_WARSHALL_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(3);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");
    expect(lastStep.variables.completed).toBe(true);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === "grid") {
      expect(snapshot.kind).toBe("grid");
      expect(snapshot.grid.length).toBe(4);
      expect(snapshot.grid[0].length).toBe(4);
    }

    // Verify distance calculation for 1 -> 4
    // 1 -> 3 is -2, 3 -> 4 is 2. So 1 -> 4 = 0.
    const distTable = lastStep.auxiliaryState.distanceTable;
    expect(distTable).toBeDefined();
    expect(distTable?.["1→3"]).toBe(-2);
    expect(distTable?.["3→4"]).toBe(2);
    expect(distTable?.["1→4"]).toBe(0);
  });

  it("should detect negative self cycles", () => {
    const inputWithNegCycle = {
      nodes: ["1", "2"],
      edges: [
        { from: "1", to: "2", weight: -3 },
        { from: "2", to: "1", weight: -2 },
      ],
    };

    const steps = generateFloydWarshallSteps(inputWithNegCycle);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.hasNegativeCycle).toBe(true);
    expect(lastStep.explanation.what).toContain("negative cycle");
  });

  it("should handle empty input graph", () => {
    const emptyInput = { nodes: [], edges: [] };
    const steps = generateFloydWarshallSteps(emptyInput);
    expect(steps.length).toBe(1);
    expect(steps[0].explanation.what).toContain("Initialize");
  });

  it("should handle undefined input or missing nodes/edges gracefully", () => {
    const steps = generateFloydWarshallSteps(
      undefined as unknown as { nodes: string[]; edges: [] },
    );
    expect(steps.length).toBe(1);
    expect(steps[0].explanation.what).toContain("Initialize on an empty graph");
  });
});
