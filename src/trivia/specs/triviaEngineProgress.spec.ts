import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  coverageRatio,
  createProgress,
  describeMode,
  gradeRound,
  isLevelCovered,
  parsePuzzleLines,
  pickRound,
  recordRound,
  remainingAt,
  type Rng,
} from "../triviaEngine";
import type { PuzzleLine, TriviaConfig, TriviaProgress, TriviaRound } from "../../types/trivia";

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

const configOf = (overrides: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...overrides,
});

const sourcesOf = (codeById: Record<string, string>): Map<string, readonly PuzzleLine[]> =>
  new Map(Object.entries(codeById).map(([id, code]) => [id, parsePuzzleLines(code)]));

const linesFor = (
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
  id: string,
): readonly PuzzleLine[] => {
  const lines = sources.get(id);
  if (!lines) throw new Error(`spec fixture is missing source "${id}"`);
  return lines;
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

const correctAnswers = (round: TriviaRound): Record<number, string> => {
  const answers: Record<number, string> = {};
  round.blanks.forEach((number) => {
    const line = round.lines.find((candidate) => candidate.number === number);
    answers[number] = line ? line.content : "";
  });
  return answers;
};

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

const TWO_LINE_B = "c = 3\nd = 4";
const THREE_LINE = "x = 1\ny = 2\nz = 3";
const ONE_LINE = "only = 1";

describe("remainingAt and isLevelCovered", () => {
  const config = configOf({ minBlanks: 1, maxBlanks: 3 });
  const sources = sourcesOf({ alpha: SIMPLE_CODE, beta: TWO_LINE_B });
  const alpha = linesFor(sources, "alpha");

  it("lists every blankable line, ascending, on fresh progress", () => {
    expect(remainingAt(createProgress(config), "alpha", alpha, 1)).toEqual([1, 2, 4, 5, 6]);
  });

  it("excludes lines drilled at that level only", () => {
    const progress = withDrilled(createProgress(config), "alpha", 1, [2, 5]);

    expect(remainingAt(progress, "alpha", alpha, 1)).toEqual([1, 4, 6]);
    expect(remainingAt(progress, "alpha", alpha, 2)).toEqual([1, 2, 4, 5, 6]);
  });

  it("ignores drilled records belonging to a different algorithm", () => {
    const progress = withDrilled(createProgress(config), "beta", 1, [1, 2]);

    expect(remainingAt(progress, "alpha", alpha, 1)).toEqual([1, 2, 4, 5, 6]);
  });

  it("reports a level uncovered while any deck entry has lines left", () => {
    const progress = withDrilled(createProgress(config), "alpha", 1, [1, 2, 4, 5, 6]);

    expect(isLevelCovered(progress, sources, 1)).toBe(false);
  });

  it("reports a level covered once every deck entry is drilled at it", () => {
    const progress = withDrilled(
      withDrilled(createProgress(config), "alpha", 1, [1, 2, 4, 5, 6]),
      "beta",
      1,
      [1, 2],
    );

    expect(isLevelCovered(progress, sources, 1)).toBe(true);
  });

  it("requires a short algorithm to be drilled fully blank at level 2 before level 2 is covered", () => {
    const mixed = sourcesOf({ tiny: ONE_LINE, alpha: SIMPLE_CODE });
    let progress = withDrilled(createProgress(config), "alpha", 2, [1, 2, 4, 5, 6]);

    expect(isLevelCovered(progress, mixed, 2)).toBe(false);

    progress = withDrilled(progress, "tiny", 2, [1]);
    expect(isLevelCovered(progress, mixed, 2)).toBe(true);
  });

  it("is vacuously covered for an empty deck", () => {
    expect(
      isLevelCovered(createProgress(config), new Map<string, readonly PuzzleLine[]>(), 1),
    ).toBe(true);
  });
});

describe("coverageRatio", () => {
  it("is 0 on a fresh deck", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ alpha: SIMPLE_CODE, beta: LONG_CODE });

    expect(coverageRatio(createProgress(config), sources, config)).toBe(0);
  });

  it("is 0 when the deck is empty", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });

    expect(
      coverageRatio(createProgress(config), new Map<string, readonly PuzzleLine[]>(), config),
    ).toBe(0);
  });

  it("is 1 when every line is drilled at every configured level", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ alpha: THREE_LINE });
    const progress: TriviaProgress = {
      ...createProgress(config),
      drilled: { alpha: { "1": [1, 2, 3], "2": [1, 2, 3], "3": [1, 2, 3] } },
    };

    expect(coverageRatio(progress, sources, config)).toBe(1);
  });

  it("includes levels an algorithm is short for by counting its available lines when sizing the curriculum", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 2 });
    const sources = sourcesOf({ tiny: ONE_LINE, alpha: THREE_LINE });
    const progress = withDrilled(createProgress(config), "tiny", 1, [1]);

    expect(coverageRatio(progress, sources, config)).toBeCloseTo(1 / 5, 10);
  });

  it("rises monotonically and never exceeds 1 as rounds are recorded", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 2, mode: "type" });
    const sources = sourcesOf({ alpha: THREE_LINE, beta: TWO_LINE_B });
    const rng = seededRng(2024);
    let progress = createProgress(config);
    let previous = coverageRatio(progress, sources, config);

    expect(previous).toBe(0);

    for (let i = 0; i < 40 && !progress.completed; i += 1) {
      const round = pickRound({ config, progress, sources, rng });
      if (!round) break;
      progress = recordRound(
        progress,
        round,
        gradeRound(round, correctAnswers(round)),
        config,
        sources,
      );
      const ratio = coverageRatio(progress, sources, config);

      expect(ratio).toBeGreaterThanOrEqual(previous);
      expect(ratio).toBeLessThanOrEqual(1);
      previous = ratio;
    }

    expect(progress.completed).toBe(true);
    expect(coverageRatio(progress, sources, config)).toBe(1);
  });
});

describe("describeMode", () => {
  it("describes each answer mode", () => {
    expect(describeMode("choice")).toBe("Drag the matching line into each blank");
    expect(describeMode("type")).toBe("Type each missing line from memory");
  });
});
