import { describe, expect, it } from "vitest";
import { primMst, DEFAULT_PRIM_MST_INPUT, generatePrimMstSteps } from "../primMst";

describe("primMst definition and step generator", () => {
  it("has correct metadata and category", () => {
    expect(primMst.id).toBe("prim-mst");
    expect(primMst.category).toBe("graph_spanning_trees");
  });

  it("produces >= 20 steps for default input", () => {
    const steps = generatePrimMstSteps(DEFAULT_PRIM_MST_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every code line in lineExplanations", () => {
    const codeLines = primMst.code.split("\n").length;
    const explanations = primMst.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });
});
