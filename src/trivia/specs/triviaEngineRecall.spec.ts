import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  createProgress,
  parsePuzzleLines,
  pickRound,
  type Rng,
} from "../triviaEngine";
import type { PuzzleLine, TriviaConfig, TriviaProgress, TriviaRound } from "../../types/trivia";

const scriptedRng = (values: readonly number[]): Rng => {
  let index = 0;
  return () => {
    if (index >= values.length) {
      throw new Error(`scriptedRng exhausted after ${values.length} draws`);
    }
    const value = values[index];
    index += 1;
    return value;
  };
};

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

const requireRound = (round: TriviaRound | null): TriviaRound => {
  if (!round) throw new Error("expected pickRound to produce a round");
  return round;
};

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

const TWO_LINE_A = "a = 1\nb = 2";

describe("pickRound weighted recall", () => {
  const SCRIPT = [0, 0.5];

  it("picks the clean line when no line has been missed", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: "type" });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const round = requireRound(
      pickRound({
        config,
        progress: createProgress(config),
        sources,
        rng: scriptedRng(SCRIPT),
      }),
    );

    expect(round.blanks).toEqual([1]);
  });

  it("surfaces a missed line ahead of an equally-eligible clean line", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: "type" });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const progress = withMisses(createProgress(config), "alpha", 2, 4);
    const round = requireRound(pickRound({ config, progress, sources, rng: scriptedRng(SCRIPT) }));

    expect(round.blanks).toEqual([2]);
  });

  it("still reaches a clean line eventually, so known lines are never starved", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: "type" });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const progress = withMisses(createProgress(config), "alpha", 2, 20);
    const rng = seededRng(4);
    const picked = new Set<number>();

    for (let i = 0; i < 60; i += 1) {
      picked.add(requireRound(pickRound({ config, progress, sources, rng })).blanks[0]);
    }

    expect(picked).toEqual(new Set([1, 2]));
  });
});
