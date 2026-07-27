import { describe, expect, it } from "vitest";
import { DEFAULT_KRUSKAL_INPUT, generateKruskalSteps, kruskalMst } from "../kruskalMst";

describe("kruskalMst algorithm spec", () => {
  it("should have correct metadata", () => {
    expect(kruskalMst.id).toBe("kruskal-mst");
    expect(kruskalMst.title).toBe("Kruskal's Minimum Spanning Tree");
    expect(kruskalMst.category).toBe("graph_spanning_trees");
    expect(kruskalMst.defaultInput).toEqual(DEFAULT_KRUSKAL_INPUT);
  });

  it("should generate steps with DSU parent array auxiliary state", () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const hasDsuParentHashMap = steps.some(
      (s) =>
        s.auxiliaryState.hashMap !== undefined && Object.keys(s.auxiliaryState.hashMap).length > 0,
    );
    expect(hasDsuParentHashMap).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Kruskal's MST complete");

    const snap = lastStep.primarySnapshot;
    if (snap.kind === "graph") {
      const pathEdges = snap.edges.filter((e) => e.isPath);

      // Default graph has 6 nodes (A, B, C, D, E, F) -> MST must have 5 edges (V-1)
      expect(pathEdges.length).toBe(5);
    }

    // Minimum weight calculation for default input:
    // A-B(1), B-C(2), C-E(3), B-D(5), D-F(7) -> total weight 18
    expect(lastStep.variables.totalMstWeight).toBe(18);
  });

  it("should map every line of pythonCode in lineExplanations", () => {
    const codeLines = kruskalMst.code.split("\n").length;
    const explanations = kruskalMst.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });

  it("should skip cycle-forming edges", () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    const hasSkippedStep = steps.some(
      (s) => s.explanation.what.includes("Skip edge") || s.variables.skipped === true,
    );
    expect(hasSkippedStep).toBe(true);
  });

  it("should handle graph with no edges", () => {
    const input = {
      nodes: [{ id: "A", label: "A", state: "default" as const }],
      edges: [],
    };
    const steps = generateKruskalSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalMstWeight).toBe(0);
  });

  it("should handle graph with empty nodes array", () => {
    const input = { nodes: [], edges: [] };
    const steps = generateKruskalSteps(input);
    expect(steps.length).toBe(2);
    expect(steps[1].explanation.what).toContain("Kruskal's MST complete");
    expect(steps[1].variables.mstEdgeCount).toBe(0);
  });

  it("should handle edges without explicit weight and reversed endpoint definitions", () => {
    const input = {
      nodes: [
        { id: "A", label: "A", state: "default" as const },
        { id: "B", label: "B", state: "default" as const },
        { id: "C", label: "C", state: "default" as const },
        { id: "D", label: "D", state: "default" as const },
      ],
      edges: [
        { from: "B", to: "A" }, // no weight, reversed orientation
        { from: "A", to: "B" }, // cycle edge without weight
        { from: "C", to: "B", weight: 2 },
        { from: "D", to: "X" }, // edge referencing non-existent node X
      ],
    };
    const steps = generateKruskalSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalMstWeight).toBe(4);
  });

  it("should trigger deep DSU path compression during find", () => {
    const input = {
      nodes: [
        { id: "A", label: "A", state: "default" as const },
        { id: "B", label: "B", state: "default" as const },
        { id: "C", label: "C", state: "default" as const },
        { id: "D", label: "D", state: "default" as const },
      ],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
        { from: "C", to: "D", weight: 3 },
        { from: "A", to: "D", weight: 4 }, // Triggers find('A') and find('D') after chain forms
      ],
    };
    const steps = generateKruskalSteps(input);
    expect(steps.length).toBeGreaterThan(0);
  });
});
