import { describe, expect, it } from "vitest";
import { disjointSetUnion, DEFAULT_DISJOINT_SET_UNION_INPUT } from "../disjointSetUnion";

describe("disjointSetUnion definition and step generator", () => {
  it("has correct metadata and category", () => {
    expect(disjointSetUnion.id).toBe("disjoint-set-union");
    expect(disjointSetUnion.category).toBe("graph_spanning_trees");
  });

  it("produces >= 20 steps for default input", () => {
    const steps = disjointSetUnion.generateSteps(DEFAULT_DISJOINT_SET_UNION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every code line in lineExplanations", () => {
    const codeLines = disjointSetUnion.code.split("\n").length;
    const explanations = disjointSetUnion.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });
});
