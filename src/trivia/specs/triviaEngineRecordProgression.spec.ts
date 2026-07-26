import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  createProgress,
  parsePuzzleLines,
  recordRound,
} from "../triviaEngine";
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaMeta,
  TriviaRound,
} from "../../types/trivia";

const configOf = (overrides: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...overrides,
});

const sourcesOf = (
  codeById: Record<string, string>,
  metaById: Record<string, TriviaMeta> = {},
): Map<string, readonly PuzzleLine[]> =>
  new Map(Object.entries(codeById).map(([id, code]) => [id, parsePuzzleLines(code, metaById[id])]));

const linesFor = (
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
  id: string,
): readonly PuzzleLine[] => {
  const lines = sources.get(id);
  if (!lines) throw new Error(`spec fixture is missing source "${id}"`);
  return lines;
};

const roundOf = (
  algorithmId: string,
  lines: readonly PuzzleLine[],
  blanks: number[],
  level = blanks.length,
): TriviaRound => ({ algorithmId, level, lines: [...lines], blanks, tiles: [] });

const gradeOf = (blanks: readonly number[], correct: readonly number[]): TriviaGrade => {
  const perBlank: Record<number, boolean> = {};
  blanks.forEach((number) => {
    perBlank[number] = correct.includes(number);
  });
  return { perBlank, allCorrect: blanks.every((number) => perBlank[number]) };
};

const SIMPLE_CODE = [
  "def f(n):",
  "    total = 0",
  "",
  "    for i in range(n):",
  "        total += i",
  "    return total",
].join("\n");

const TWO_LINE_A = "a = 1\nb = 2";
const TWO_LINE_B = "c = 3\nd = 4";
const THREE_LINE = "x = 1\ny = 2\nz = 3";
const ONE_LINE = "only = 1";

describe("recordRound progression & completion", () => {
  const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
  const sources = sourcesOf({ alpha: SIMPLE_CODE });
  const lines = linesFor(sources, "alpha");

  it("does not advance the level while the deck still has uncovered lines", () => {
    const round = roundOf("alpha", lines, [2], 1);
    const next = recordRound(createProgress(config), round, gradeOf([2], [2]), config, sources);

    expect(next.level).toBe(1);
    expect(next.completed).toBe(false);
  });

  it("advances only once every algorithm of a multi-algorithm deck is covered", () => {
    const deckConfig = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
    const deck = sourcesOf({ alpha: TWO_LINE_A, beta: TWO_LINE_B });
    const alpha = linesFor(deck, "alpha");
    const beta = linesFor(deck, "beta");
    let progress = createProgress(deckConfig);

    progress = recordRound(
      progress,
      roundOf("alpha", alpha, [1], 1),
      gradeOf([1], [1]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(1);

    progress = recordRound(
      progress,
      roundOf("alpha", alpha, [2], 1),
      gradeOf([2], [2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(1);

    progress = recordRound(
      progress,
      roundOf("beta", beta, [1], 1),
      gradeOf([1], [1]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(1);

    progress = recordRound(
      progress,
      roundOf("beta", beta, [2], 1),
      gradeOf([2], [2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(2);
    expect(progress.completed).toBe(false);

    progress = recordRound(
      progress,
      roundOf("alpha", alpha, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(2);

    progress = recordRound(
      progress,
      roundOf("beta", beta, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(3);
  });

  it("advances on a wrong round too, since a fumbled line still counts as drilled", () => {
    const soloConfig = configOf({ minBlanks: 1, maxBlanks: 2, mode: "type" });
    const solo = sourcesOf({ tiny: ONE_LINE });
    const tiny = linesFor(solo, "tiny");
    const next = recordRound(
      createProgress(soloConfig),
      roundOf("tiny", tiny, [1], 1),
      gradeOf([1], []),
      soloConfig,
      solo,
    );

    expect(next.level).toBe(2);
    expect(next.stats.tiny["1"]).toEqual({ attempts: 1, misses: 1 });
  });

  it("treats an algorithm too short for the level as satisfied rather than blocking", () => {
    const mixedConfig = configOf({ minBlanks: 2, maxBlanks: 3, mode: "type" });
    const mixed = sourcesOf({ tiny: ONE_LINE, alpha: TWO_LINE_A });
    const alpha = linesFor(mixed, "alpha");
    const next = recordRound(
      createProgress(mixedConfig),
      roundOf("alpha", alpha, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      mixedConfig,
      mixed,
    );

    expect(next.level).toBe(3);
  });

  it("sets completed when the ceiling level is covered and stops advancing", () => {
    const topConfig = configOf({ minBlanks: 3, maxBlanks: 3, mode: "type" });
    const top = sourcesOf({ alpha: THREE_LINE });
    const alpha = linesFor(top, "alpha");
    const round = roundOf("alpha", alpha, [1, 2, 3], 3);
    const done = recordRound(
      createProgress(topConfig),
      round,
      gradeOf([1, 2, 3], [1, 2, 3]),
      topConfig,
      top,
    );

    expect(done).toMatchObject({ completed: true, level: 3 });

    const again = recordRound(done, round, gradeOf([1, 2, 3], [1, 2, 3]), topConfig, top);

    expect(again).toMatchObject({ completed: true, level: 3 });
    expect(again.roundsPlayed).toBe(2);
  });
});
