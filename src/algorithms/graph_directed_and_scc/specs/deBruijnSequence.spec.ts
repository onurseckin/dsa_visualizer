import { describe, expect, it } from "vitest";
import {
  deBruijnSequence,
  DEFAULT_DE_BRUIJN_INPUT,
  generateDeBruijnSteps,
} from "../deBruijnSequence";

describe("deBruijnSequence definition and step generator", () => {
  it("has correct metadata and category", () => {
    expect(deBruijnSequence.id).toBe("de-bruijn-sequence");
    expect(deBruijnSequence.category).toBe("graph_directed_and_scc");
  });

  it("produces >= 20 steps for default input", () => {
    const steps = generateDeBruijnSteps(DEFAULT_DE_BRUIJN_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("maps every code line in lineExplanations", () => {
    const codeLines = deBruijnSequence.code.split("\n").length;
    const explanations = deBruijnSequence.trivia?.lineExplanations ?? {};
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i], `Missing explanation for line ${i}`).toBeDefined();
    }
  });
});
