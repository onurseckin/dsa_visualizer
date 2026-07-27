import { describe, expect, it } from "vitest";
import {
  spragueGrundyTheorem,
  generateSpragueGrundySteps,
  DEFAULT_SPRAGUE_GRUNDY_INPUT,
  type SpragueGrundyInput,
} from "../spragueGrundyTheorem";

describe("spragueGrundyTheorem algorithm logic spec", () => {
  it("has categories ['game_theory'] and valid metadata", () => {
    expect(spragueGrundyTheorem.id).toBe("sprague-grundy-theorem");
    expect(spragueGrundyTheorem.categories).toEqual(["game_theory"]);
    expect(spragueGrundyTheorem.difficulty).toBe("Medium");
    expect(spragueGrundyTheorem.code).toContain("def sprague_grundy");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = spragueGrundyTheorem.code.split("\n");
    const lineExplanations = spragueGrundyTheorem.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = spragueGrundyTheorem.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });

  it("generates >= 20 steps for default input", () => {
    const steps = generateSpragueGrundySteps(DEFAULT_SPRAGUE_GRUNDY_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("array");
    expect(lastStep.variables.winningPlayer).toBeDefined();
  });

  it("handles basic example (P1 wins)", () => {
    const steps = generateSpragueGrundySteps({ pileSizes: [3, 4], allowedMoves: [1, 2, 3] });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.nimSum).toBe(3);
    expect(lastStep.variables.winningPlayer).toBe("First Player (P1)");
  });

  it("handles fallback and empty inputs", () => {
    const steps = generateSpragueGrundySteps({} as SpragueGrundyInput);
    expect(steps.length).toBeGreaterThan(0);
  });
});
