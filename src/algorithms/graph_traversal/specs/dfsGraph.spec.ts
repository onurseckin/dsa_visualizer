import { describe, expect, it } from "vitest";
import { dfsGraph, DEFAULT_DFS_GRAPH_INPUT, generateDfsGraphSteps } from "../dfsGraph";

describe("dfsGraph spec logic", () => {
  it("has category graph_traversal and valid metadata", () => {
    expect(dfsGraph.id).toBe("dfs-graph");
    expect(dfsGraph.title).toBe("DFS Graph Traversal");
    expect(dfsGraph.category).toBe("graph_traversal");
    expect(dfsGraph.defaultInput).toEqual(DEFAULT_DFS_GRAPH_INPUT);
    expect(dfsGraph.difficulty).toBe("Easy");
  });

  it("produces at least 20 steps for default input", () => {
    const steps = generateDfsGraphSteps(DEFAULT_DFS_GRAPH_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every non-blank code line in lineExplanations", () => {
    const meta = dfsGraph.trivia;
    const lines = dfsGraph.code.replace(/\s+$/, "").split("\n");
    expect(meta?.lineExplanations).toBeDefined();

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim().length > 0) {
        expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
        expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      }
    });
  });
});
