import { describe, expect, it } from "vitest";
import {
  bipartiteGraphCheck,
  DEFAULT_BIPARTITE_INPUT,
  generateBipartiteCheckSteps,
} from "../bipartiteGraphCheck";

describe("bipartiteGraphCheck spec logic", () => {
  it("has category graph_traversal and valid metadata", () => {
    expect(bipartiteGraphCheck.id).toBe("bipartite-graph-check");
    expect(bipartiteGraphCheck.title).toBe("Bipartite Graph Check (2-Coloring)");
    expect(bipartiteGraphCheck.topicIds).toContain("graph_traversal");
    expect(bipartiteGraphCheck.defaultInput).toEqual(DEFAULT_BIPARTITE_INPUT);
    expect(bipartiteGraphCheck.difficulty).toBe("Medium");
  });

  it("produces at least 20 steps for default input", () => {
    const steps = generateBipartiteCheckSteps(DEFAULT_BIPARTITE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every non-blank code line in lineExplanations", () => {
    const meta = bipartiteGraphCheck.trivia;
    const lines = bipartiteGraphCheck.code.replace(/\s+$/, "").split("\n");
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
