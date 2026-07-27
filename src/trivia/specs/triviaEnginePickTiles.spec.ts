import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  createProgress,
  parsePuzzleLines,
  pickRound,
  type Rng,
} from "../triviaEngine";
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
} from "../../types/trivia";

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

const requireRound = (round: TriviaRound | null): TriviaRound => {
  if (!round) throw new Error("expected pickRound to produce a round");
  return round;
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
const TWO_LINE_B = "c = 3\nd = 4";

describe("pickRound algorithm & line selection, tile generation", () => {
  it("prefers an algorithm with uncovered lines over one the rng would otherwise pick", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ alpha: TWO_LINE_A, beta: TWO_LINE_B });
    const fresh = createProgress(config);

    expect(
      requireRound(pickRound({ config, progress: fresh, sources, rng: zeroRng() })).algorithmId,
    ).toBe("alpha");

    const alphaDone = withDrilled(fresh, "alpha", 1, [1, 2]);

    expect(
      requireRound(pickRound({ config, progress: alphaDone, sources, rng: zeroRng() })).algorithmId,
    ).toBe("beta");
  });

  it("falls back to every eligible algorithm once the level is fully covered", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const covered = withDrilled(createProgress(config), "alpha", 1, [1, 2]);
    const round = requireRound(pickRound({ config, progress: covered, sources, rng: zeroRng() }));

    expect(round.algorithmId).toBe("alpha");
    expect(round.blanks).toHaveLength(1);
  });

  it("prefers undrilled lines before re-using drilled ones", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const progress = withDrilled(createProgress(config), "alpha", 1, [1, 2, 4]);

    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const round = requireRound(pickRound({ config, progress, sources, rng: seededRng(seed) }));

      expect([5, 6]).toContain(round.blanks[0]);
    }
  });

  it("tops up from already-drilled lines when fewer than `level` remain undrilled", () => {
    const config = configOf({ minBlanks: 2, maxBlanks: 3, mode: "type" });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const progress = withDrilled(createProgress(config), "alpha", 2, [1, 2, 4, 5]);

    for (const seed of [1, 2, 3, 9, 17]) {
      const round = requireRound(pickRound({ config, progress, sources, rng: seededRng(seed) }));

      expect(round.blanks).toHaveLength(2);
      expect(new Set(round.blanks).size).toBe(2);
      expect(round.blanks).toContain(6);
      expect([1, 2, 4, 5]).toContain(round.blanks.find((n) => n !== 6));
    }
  });

  it("returns tiles only in choice mode", () => {
    const sources = sourcesOf({ alpha: LONG_CODE });
    const choice = configOf({ minBlanks: 2, maxBlanks: 2, mode: "choice", includeDistractors: true });
    const type = configOf({ minBlanks: 2, maxBlanks: 2, mode: "type" });

    const choiceRound = requireRound(
      pickRound({ config: choice, progress: createProgress(choice), sources, rng: zeroRng() }),
    );
    const typeRound = requireRound(
      pickRound({ config: type, progress: createProgress(type), sources, rng: zeroRng() }),
    );

    expect(choiceRound.tiles).toHaveLength(4);
    expect(typeRound.tiles).toEqual([]);
  });

  it("omits author distractors from the tray when includeDistractors is off", () => {
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const meta = new Map<string, TriviaMeta | undefined>([
      ["alpha", { distractors: ["a = 2", "b = 1"] }],
    ]);
    const on = configOf({ minBlanks: 2, maxBlanks: 2, mode: "choice", includeDistractors: true });
    const off = configOf({ minBlanks: 2, maxBlanks: 2, mode: "choice", includeDistractors: false });

    const withDistractors = requireRound(
      pickRound({ config: on, progress: createProgress(on), sources, meta, rng: zeroRng() }),
    );
    const withoutDistractors = requireRound(
      pickRound({ config: off, progress: createProgress(off), sources, meta, rng: zeroRng() }),
    );

    expect(texts(withDistractors).sort()).toEqual(["a = 1", "a = 2", "b = 1", "b = 2"]);
    expect(texts(withoutDistractors).sort()).toEqual(["a = 1", "b = 2"]);
  });
});
