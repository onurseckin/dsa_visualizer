import { describe, expect, it } from "vitest";
import { kosarajuScc, DEFAULT_KOSARAJU_INPUT, generateKosarajuSccSteps } from "../kosarajuScc";

describe("kosarajuScc algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(kosarajuScc.id).toBe("kosaraju-scc");
    expect(kosarajuScc.title).toBe("Kosaraju's Strongly Connected Components");
    expect(kosarajuScc.category).toBe("graph_directed_and_scc");
    expect(kosarajuScc.difficulty).toBe("Hard");
    expect(kosarajuScc.defaultInput).toEqual(DEFAULT_KOSARAJU_INPUT);
  });

  it("should generate steps and compute 2 SCCs for default input graph", () => {
    const steps = generateKosarajuSccSteps(DEFAULT_KOSARAJU_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.sccCount).toBe(2);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === "graph") {
      expect(snapshot.kind).toBe("graph");
      expect(snapshot.nodes).toHaveLength(5);

      // All nodes should be in sorted state after SCC assignment
      const sortedNodes = snapshot.nodes.filter((n) => n.state === "sorted");
      expect(sortedNodes).toHaveLength(5);
    }
  });

  it("should handle a single strongly connected cycle", () => {
    const input = {
      nodes: [
        { id: "0", label: "0", state: "default" as const },
        { id: "1", label: "1", state: "default" as const },
        { id: "2", label: "2", state: "default" as const },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "0" },
      ],
    };
    const steps = generateKosarajuSccSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.sccCount).toBe(1);
  });

  it("should handle a DAG with no cycles (each node is its own SCC)", () => {
    const input = {
      nodes: [
        { id: "0", label: "0", state: "default" as const },
        { id: "1", label: "1", state: "default" as const },
      ],
      edges: [{ from: "0", to: "1" }],
    };
    const steps = generateKosarajuSccSteps(input);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.variables.sccCount).toBe(2);
  });
});
