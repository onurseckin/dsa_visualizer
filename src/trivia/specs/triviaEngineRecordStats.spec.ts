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
  TriviaProgress,
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

const withDrilled = (
  progress: TriviaProgress,
  algorithmId: string,
  level: number,
  lines: number[],
): TriviaProgress => ({
  ...progress,
  drilled: {
    ...progress.drilled,
    [algorithmId]: { ...(progress.drilled[algorithmId] ?? {}), [String(level)]: lines },
  },
});

const withMisses = (
  progress: TriviaProgress,
  algorithmId: string,
  line: number,
  misses: number,
): TriviaProgress => ({
  ...progress,
  stats: {
    ...progress.stats,
    [algorithmId]: {
      ...(progress.stats[algorithmId] ?? {}),
      [String(line)]: { attempts: misses, misses },
    },
  },
});

const SIMPLE_CODE = [
  "def f(n):",
  "    total = 0",
  "",
  "    for i in range(n):",
  "        total += i",
  "    return total",
].join("\n");

describe("recordRound stats & immutability", () => {
  const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
  const sources = sourcesOf({ alpha: SIMPLE_CODE });
  const lines = linesFor(sources, "alpha");

  it("marks the round blanks drilled at the round level", () => {
    const round = roundOf("alpha", lines, [2, 5], 2);
    const next = recordRound(
      createProgress(config),
      round,
      gradeOf([2, 5], [2, 5]),
      config,
      sources,
    );

    expect(next.drilled.alpha).toEqual({ "2": [2, 5] });
    expect(next.roundsPlayed).toBe(1);
  });

  it("merges with previously drilled lines without duplicates and stays ascending", () => {
    const progress = withDrilled(createProgress(config), "alpha", 2, [5, 1]);
    const round = roundOf("alpha", lines, [2, 5], 2);
    const next = recordRound(progress, round, gradeOf([2, 5], [2, 5]), config, sources);

    expect(next.drilled.alpha["2"]).toEqual([1, 2, 5]);
  });

  it("records drilled lines per level, leaving other levels alone", () => {
    const progress = withDrilled(createProgress(config), "alpha", 1, [1]);
    const round = roundOf("alpha", lines, [2, 4], 2);
    const next = recordRound(progress, round, gradeOf([2, 4], [2, 4]), config, sources);

    expect(next.drilled.alpha).toEqual({ "1": [1], "2": [2, 4] });
  });

  it("increments attempts for every blank but misses only for wrong answers", () => {
    const round = roundOf("alpha", lines, [2, 5], 2);
    const next = recordRound(createProgress(config), round, gradeOf([2, 5], [2]), config, sources);

    expect(next.stats.alpha).toEqual({
      "2": { attempts: 1, misses: 0 },
      "5": { attempts: 1, misses: 1 },
    });
  });

  it("accumulates per-line accuracy across rounds", () => {
    const round = roundOf("alpha", lines, [2], 1);
    const first = recordRound(createProgress(config), round, gradeOf([2], []), config, sources);
    const second = recordRound(first, round, gradeOf([2], [2]), config, sources);

    expect(second.stats.alpha["2"]).toEqual({ attempts: 2, misses: 1 });
    expect(second.roundsPlayed).toBe(2);
  });

  it("never mutates the progress it was given", () => {
    const progress: TriviaProgress = {
      ...withMisses(withDrilled(createProgress(config), "alpha", 2, [1]), "alpha", 1, 2),
      roundsPlayed: 4,
    };
    const before = JSON.stringify(progress);
    const round = roundOf("alpha", lines, [1, 2], 2);

    const next = recordRound(progress, round, gradeOf([1, 2], [1]), config, sources);

    expect(JSON.stringify(progress)).toBe(before);
    expect(progress.drilled.alpha["2"]).toEqual([1]);
    expect(progress.stats.alpha["1"]).toEqual({ attempts: 2, misses: 2 });
    expect(progress.roundsPlayed).toBe(4);
    expect(next).not.toBe(progress);
    expect(next.drilled).not.toBe(progress.drilled);
    expect(next.stats).not.toBe(progress.stats);
    expect(next.drilled.alpha["2"]).toEqual([1, 2]);
  });

  it("does not mutate the round it folds in", () => {
    const round = roundOf("alpha", lines, [4, 5], 2);
    const before = JSON.stringify(round);

    recordRound(createProgress(config), round, gradeOf([4, 5], [4, 5]), config, sources);

    expect(JSON.stringify(round)).toBe(before);
  });
});
