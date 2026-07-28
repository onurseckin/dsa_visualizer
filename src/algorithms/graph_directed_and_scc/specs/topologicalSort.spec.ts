import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOPO_SORT_INPUT,
  generateTopologicalSortSteps,
  topologicalSort,
} from "../topologicalSort";

describe("topologicalSort algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(topologicalSort.id).toBe("topological-sort");
    expect(topologicalSort.title).toBe("Topological Sort (Kahn's Algorithm)");
    expect(topologicalSort.topicIds).toContain("graph_directed_and_scc");
    expect(topologicalSort.defaultInput).toEqual(DEFAULT_TOPO_SORT_INPUT);
  });

  it("should generate steps with In-Degree auxiliary state and valid topological order", () => {
    const steps = generateTopologicalSortSteps(DEFAULT_TOPO_SORT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(3);

    const snapshot = firstStep.primarySnapshot;
    if (snapshot.kind === "graph") {
      expect(snapshot.kind).toBe("graph");
    }

    const hasInDegreeHashMap = steps.some(
      (s) =>
        s.auxiliaryState.hashMap !== undefined && Object.keys(s.auxiliaryState.hashMap).length > 0,
    );
    expect(hasInDegreeHashMap).toBe(true);

    const hasQueue = steps.some((s) => s.auxiliaryState.queue !== undefined);
    expect(hasQueue).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Topological Sort complete");

    const topoOrder = lastStep.auxiliaryState.visited;
    expect(topoOrder).toBeDefined();
    expect(topoOrder?.length).toBe(6);

    // Verify ordering respects DAG dependencies
    // 5 -> 2, 5 -> 0, 4 -> 0, 4 -> 1, 2 -> 3, 3 -> 1
    const indexMap: Record<string, number> = {};
    topoOrder?.forEach((id, idx) => {
      indexMap[String(id)] = idx;
    });

    expect(indexMap["5"]).toBeLessThan(indexMap["2"]);
    expect(indexMap["5"]).toBeLessThan(indexMap["0"]);
    expect(indexMap["4"]).toBeLessThan(indexMap["0"]);
    expect(indexMap["4"]).toBeLessThan(indexMap["1"]);
    expect(indexMap["2"]).toBeLessThan(indexMap["3"]);
    expect(indexMap["3"]).toBeLessThan(indexMap["1"]);
  });

  it("should map every line of pythonCode in lineExplanations", () => {
    const codeLines = topologicalSort.code.split("\n").length;
    const explanations = topologicalSort.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });

  it("should detect cycles in directed graphs", () => {
    const cyclicInput = {
      nodes: [
        { id: "A", label: "A", state: "default" as const },
        { id: "B", label: "B", state: "default" as const },
        { id: "C", label: "C", state: "default" as const },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" },
      ],
    };

    const steps = generateTopologicalSortSteps(cyclicInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Cycle detected");
    expect(lastStep.variables.hasCycle).toBe(true);
  });

  it("should handle empty graph", () => {
    const emptyInput = { nodes: [], edges: [] };
    const steps = generateTopologicalSortSteps(emptyInput);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");
  });
});
