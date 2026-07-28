import { describe, expect, it } from "vitest";
import {
  hierholzerEulerianPath,
  DEFAULT_HIERHOLZER_INPUT,
  generateHierholzerSteps,
} from "../hierholzerEulerianPath";

describe("hierholzerEulerianPath definition and step generator", () => {
  it("has correct metadata and category", () => {
    expect(hierholzerEulerianPath.id).toBe("hierholzer-eulerian-path");
    expect(hierholzerEulerianPath.topicIds).toContain("graph_directed_and_scc");
  });

  it("produces >= 20 steps for default input", () => {
    const steps = generateHierholzerSteps(DEFAULT_HIERHOLZER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every code line in lineExplanations", () => {
    const codeLines = hierholzerEulerianPath.code.split("\n").length;
    const explanations = hierholzerEulerianPath.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });
});
