import { describe, expect, it } from "vitest";
import { buildTiles, gradeRound, parsePuzzleLines, type Rng } from "../triviaEngine";
import type { PuzzleLine, TriviaMeta, TriviaRound } from "../../types/trivia";

const zeroRng = (): Rng => () => 0;

const seededRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const roundOf = (
  algorithmId: string,
  lines: readonly PuzzleLine[],
  blanks: number[],
  level = blanks.length,
): TriviaRound => ({ algorithmId, level, lines: [...lines], blanks, tiles: [] });

const texts = (round: TriviaRound): string[] => round.tiles.map((tile) => tile.text);

const SIMPLE_CODE = [
  "def f(n):",
  "    total = 0",
  "",
  "    for i in range(n):",
  "        total += i",
  "    return total",
].join("\n");

const LONG_CODE = [
  "def solve(nums):",
  "    total = 0",
  "    best = 0",
  "    for num in nums:",
  "        total += num",
  "        best = max(best, total)",
  "    if best < 0:",
  "        best = 0",
  "    return best",
].join("\n");

const TWO_LINE_A = "a = 1\nb = 2";
const THREE_LINE = "x = 1\ny = 2\nz = 3";
const REPEATED_RETURN_CODE = ["if not matrix:", "    return False", "return False"].join("\n");

describe("buildTiles", () => {
  it("emits one answer tile per blank, carrying the line content and its number", () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [2, 5], undefined, zeroRng());
    const answers = tiles.filter((tile) => tile.correctFor !== null);

    expect(answers).toHaveLength(2);
    expect(answers.find((tile) => tile.correctFor === 2)?.text).toBe("total = 0");
    expect(answers.find((tile) => tile.correctFor === 5)?.text).toBe("total += num");
  });

  it("draws decoys from other real lines of the same solution with correctFor null", () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [2, 5], undefined, seededRng(11));
    const decoys = tiles.filter((tile) => tile.correctFor === null);
    const spareContent = lines
      .filter((line) => line.blankable && line.number !== 2 && line.number !== 5)
      .map((line) => line.content);

    expect(decoys).toHaveLength(2);
    decoys.forEach((decoy) => expect(spareContent).toContain(decoy.text));
  });

  it("never uses a blanked line or a non-blankable line as a decoy", () => {
    const lines = parsePuzzleLines(SIMPLE_CODE, { skipLines: [1] });
    const tiles = buildTiles(lines, [2], undefined, seededRng(3));

    expect(texts({ ...roundOf("alpha", lines, [2]), tiles })).not.toContain("def f(n):");
    expect(tiles.filter((tile) => tile.text === "total = 0")).toHaveLength(1);
    expect(tiles.some((tile) => tile.text === "")).toBe(false);
  });

  it("includes author distractors when the decoy pool is otherwise empty", () => {
    const lines = parsePuzzleLines(TWO_LINE_A);
    const meta: TriviaMeta = { distractors: ["a = 99", "b = 99"] };
    const tiles = buildTiles(lines, [1, 2], meta, seededRng(8));
    const decoys = tiles.filter((tile) => tile.correctFor === null).map((tile) => tile.text);

    expect(decoys.sort()).toEqual(["a = 99", "b = 99"]);
  });

  it("adds no decoys at all when neither spare lines nor distractors exist", () => {
    const lines = parsePuzzleLines(TWO_LINE_A);
    const tiles = buildTiles(lines, [1, 2], undefined, seededRng(8));

    expect(tiles).toHaveLength(2);
    expect(tiles.every((tile) => tile.correctFor !== null)).toBe(true);
  });

  it("keeps the tray proportional to the blanks when distractors are on: one decoy per blank", () => {
    const lines = parsePuzzleLines(LONG_CODE);

    expect(buildTiles(lines, [1], undefined, true, seededRng(2))).toHaveLength(2);
    expect(buildTiles(lines, [1, 2], undefined, true, seededRng(2))).toHaveLength(4);
    expect(buildTiles(lines, [1, 2, 3], undefined, true, seededRng(2))).toHaveLength(6);
  });

  it("emits zero decoys when includeDistractors is false", () => {
    const lines = parsePuzzleLines(LONG_CODE);

    expect(buildTiles(lines, [1], undefined, false, seededRng(2))).toHaveLength(1);
    expect(buildTiles(lines, [1, 2], undefined, false, seededRng(2))).toHaveLength(2);
  });

  it("caps the decoy count by what the solution can actually supply", () => {
    const lines = parsePuzzleLines(THREE_LINE);
    const tiles = buildTiles(lines, [1, 2], undefined, seededRng(5));

    expect(tiles).toHaveLength(3);
    expect(tiles.filter((tile) => tile.correctFor === null)).toHaveLength(1);
  });

  it("collapses duplicate decoy candidates instead of showing the same tile twice", () => {
    const lines = parsePuzzleLines("target = 1\n    left += 1\n    left += 1\nreturn target");
    const tiles = buildTiles(lines, [1, 4], undefined, seededRng(6));

    expect(new Set(texts({ ...roundOf("alpha", lines, [1, 4]), tiles }))).toHaveLength(
      tiles.length,
    );
  });

  it("grades either tile when a spare line repeats the answer verbatim", () => {
    const lines = parsePuzzleLines(REPEATED_RETURN_CODE);
    const tiles = buildTiles(lines, [2], undefined, zeroRng());
    const round = { ...roundOf("alpha", lines, [2]), tiles };

    tiles
      .filter((tile) => tile.text === "return False")
      .forEach((tile) => {
        expect(gradeRound(round, { 2: tile.text }).allCorrect).toBe(true);
      });
    expect(tiles.filter((tile) => tile.correctFor === 2)).toHaveLength(1);
  });

  it("gives every tile a unique id", () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [1, 4, 7], { distractors: ["nope = 1"] }, seededRng(13));

    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(tiles.length);
  });
});
