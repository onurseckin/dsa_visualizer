import { describe, expect, it } from "vitest";
import { blankableLines, parsePuzzleLines } from "../triviaEngine";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";

const DECK = ["two-sum", "bubble-sort", "binary-search-matrix", "bfs-graph"] as const;

const definitionOf = (id: string) => {
  const definition = ALGORITHM_REGISTRY[id];
  if (!definition) throw new Error(`registry is missing "${id}"`);
  return definition;
};

describe("authored trivia metadata stays in range", () => {
  it.each([...DECK])("%s references only real, drillable lines", (id) => {
    const definition = definitionOf(id);
    const trivia = definition.trivia;
    expect(trivia).toBeDefined();
    if (trivia === undefined) return;

    const lines = parsePuzzleLines(definition.code, trivia);
    const blankable = new Set(blankableLines(lines));

    (trivia.skipLines ?? []).forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      // A skipped line must actually be excluded, or the author's intent is lost.
      expect(blankable.has(line)).toBe(false);
    });

    /* A hint on a line the drill never hides can never be shown, so an off-by-one
       here is invisible in the UI — this is the only place it surfaces. */
    (trivia.hints ?? []).forEach((entry) => {
      expect(entry.line).toBeGreaterThanOrEqual(1);
      expect(entry.line).toBeLessThanOrEqual(lines.length);
      expect(blankable.has(entry.line)).toBe(true);
      expect(entry.hint.trim().length).toBeGreaterThan(0);
    });
    expect(new Set((trivia.hints ?? []).map((entry) => entry.line)).size).toBe(
      (trivia.hints ?? []).length,
    );
  });

  it.each([...DECK])("%s has no distractor that is really a correct line", (id) => {
    const definition = definitionOf(id);
    const distractors = definition.trivia?.distractors ?? [];
    const real = new Set(
      definition.code
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    );

    expect(distractors.length).toBeGreaterThan(0);
    distractors.forEach((distractor) => {
      expect(distractor.trim().length).toBeGreaterThan(0);
      // Grading is trim-compared, so a distractor differing only by indentation
      // would be a "wrong" tile that grades as correct.
      expect(real.has(distractor.trim())).toBe(false);
    });
    expect(new Set(distractors.map((entry) => entry.trim())).size).toBe(distractors.length);
  });
});
