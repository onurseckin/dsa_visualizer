import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  blankableLines,
  createProgress,
  parsePuzzleLines,
  pickRound,
  type Rng,
} from "../triviaEngine";
import type { PuzzleLine, TriviaConfig, TriviaMeta, TriviaRound } from "../../types/trivia";

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

const requireRound = (round: TriviaRound | null): TriviaRound => {
  if (!round) throw new Error("expected pickRound to produce a round");
  return round;
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

const TWO_LINE_A = "a = 1\nb = 2";
const ONE_LINE = "only = 1";

describe("pickRound null guards and boundaries", () => {
  it("returns null on an empty deck", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });

    expect(
      pickRound({
        config,
        progress: createProgress(config),
        sources: new Map<string, readonly PuzzleLine[]>(),
        rng: zeroRng(),
      }),
    ).toBeNull();
  });

  it("returns null once the drill is completed", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ alpha: LONG_CODE });

    expect(
      pickRound({
        config,
        progress: { ...createProgress(config), completed: true },
        sources,
        rng: zeroRng(),
      }),
    ).toBeNull();
  });

  it("returns null when no deck entry has enough blankable lines for the level", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ tiny: ONE_LINE });

    expect(
      pickRound({
        config,
        progress: { ...createProgress(config), level: 2 },
        sources,
        rng: zeroRng(),
      }),
    ).toBeNull();
  });

  it("hides exactly `level` lines, ascending, unique and all blankable", () => {
    const config = configOf({ minBlanks: 3, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ alpha: SIMPLE_CODE, beta: LONG_CODE });
    const progress = createProgress(config);

    for (const seed of [1, 2, 3, 7, 42, 1337]) {
      const round = requireRound(pickRound({ config, progress, sources, rng: seededRng(seed) }));
      const allowed = blankableLines(linesFor(sources, round.algorithmId));

      expect(round.level).toBe(3);
      expect(round.blanks).toHaveLength(3);
      expect(new Set(round.blanks).size).toBe(3);
      expect([...round.blanks].sort((a, b) => a - b)).toEqual(round.blanks);
      round.blanks.forEach((number) => expect(allowed).toContain(number));
    }
  });

  it("reports the full solution as a copy so callers cannot mutate the source", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: "type" });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const lines = linesFor(sources, "alpha");
    const round = requireRound(
      pickRound({ config, progress: createProgress(config), sources, rng: zeroRng() }),
    );

    expect(round.lines).toEqual(lines);
    expect(round.lines).not.toBe(lines);
  });

  it("skips algorithms with fewer blankable lines than the level", () => {
    const config = configOf({ minBlanks: 3, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ tiny: TWO_LINE_A, alpha: LONG_CODE });

    for (const seed of [1, 5, 11, 23]) {
      const round = requireRound(
        pickRound({ config, progress: createProgress(config), sources, rng: seededRng(seed) }),
      );

      expect(round.algorithmId).toBe("alpha");
    }
  });

  it("clamps a stored level into the configured range", () => {
    const sources = sourcesOf({ alpha: LONG_CODE });
    const highConfig = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
    const lowConfig = configOf({ minBlanks: 2, maxBlanks: 4, mode: "type" });

    expect(
      requireRound(
        pickRound({
          config: highConfig,
          progress: { ...createProgress(highConfig), level: 99 },
          sources,
          rng: zeroRng(),
        }),
      ).blanks,
    ).toHaveLength(3);

    expect(
      requireRound(
        pickRound({
          config: lowConfig,
          progress: { ...createProgress(lowConfig), level: 0 },
          sources,
          rng: zeroRng(),
        }),
      ).blanks,
    ).toHaveLength(2);
  });
});
