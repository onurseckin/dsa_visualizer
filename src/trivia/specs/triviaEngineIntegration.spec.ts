import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  blankableLines,
  coverageRatio,
  createProgress,
  gradeRound,
  parsePuzzleLines,
  pickRound,
  recordRound,
  remainingAt,
  type Rng,
} from "../triviaEngine";
import type { PuzzleLine, TriviaConfig, TriviaMeta, TriviaRound } from "../../types/trivia";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";

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

const requireRound = (round: TriviaRound | null): TriviaRound => {
  if (!round) throw new Error("expected pickRound to produce a round");
  return round;
};

const correctAnswers = (round: TriviaRound): Record<number, string> => {
  const answers: Record<number, string> = {};
  round.blanks.forEach((number) => {
    const line = round.lines.find((candidate) => candidate.number === number);
    answers[number] = line ? line.content : "";
  });
  return answers;
};

describe("end to end over a real four-algorithm deck", () => {
  const DECK = ["two-sum", "bubble-sort", "binary-search-matrix", "bfs-graph"];

  const realSources = (): Map<string, readonly PuzzleLine[]> =>
    new Map(
      DECK.map((id) => {
        const definition = ALGORITHM_REGISTRY[id];
        if (!definition) throw new Error(`registry is missing "${id}"`);
        return [id, parsePuzzleLines(definition.code, definition.trivia)];
      }),
    );

  const realMeta = (): Map<string, TriviaMeta | undefined> =>
    new Map(DECK.map((id) => [id, ALGORITHM_REGISTRY[id].trivia]));

  it("parses every deck entry into drillable lines", () => {
    const sources = realSources();

    expect(sources.size).toBe(4);
    for (const [id, lines] of sources) {
      expect(blankableLines(lines).length).toBeGreaterThanOrEqual(4);
      expect(lines.map((line) => line.number)).toEqual(lines.map((_line, index) => index + 1));
      lines.forEach((line) => {
        expect(line.indent + line.content).toBe(line.text);
        if (line.blankable) expect(line.content.trim().length).toBeGreaterThan(0);
        if (line.content.trim().length === 0) expect(line.blankable).toBe(false);
      });
      expect(id).toBeTruthy();
    }
  });

  it("escalates from minBlanks to maxBlanks and completes when answered correctly", () => {
    const config = configOf({
      deck: DECK,
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 3,
      includeDistractors: true,
    });
    const sources = realSources();
    const meta = realMeta();
    const rng = seededRng(0xc0ffee);
    const MAX_ROUNDS = 600;

    let progress = createProgress(config);
    const levelsSeen: number[] = [progress.level];
    let rounds = 0;

    expect(progress.level).toBe(1);

    while (!progress.completed && rounds < MAX_ROUNDS) {
      const round = requireRound(pickRound({ config, progress, sources, meta, rng }));

      expect(round.level).toBe(progress.level);
      expect(round.blanks).toHaveLength(round.level);
      expect(new Set(round.blanks).size).toBe(round.level);
      expect(round.tiles.length).toBeGreaterThanOrEqual(round.level);

      const grade = gradeRound(round, correctAnswers(round));
      expect(grade.allCorrect).toBe(true);

      const next = recordRound(progress, round, grade, config, sources);
      expect(next.level).toBeGreaterThanOrEqual(progress.level);
      if (next.level !== progress.level) levelsSeen.push(next.level);

      progress = next;
      rounds += 1;
    }

    expect(rounds).toBeLessThan(MAX_ROUNDS);
    expect(progress.completed).toBe(true);
    expect(levelsSeen).toEqual([1, 2, 3]);
    expect(progress.level).toBe(3);
    expect(progress.roundsPlayed).toBe(rounds);
    expect(coverageRatio(progress, sources, config)).toBe(1);
    expect(pickRound({ config, progress, sources, meta, rng })).toBeNull();

    for (const [id, lines] of sources) {
      for (const level of [1, 2, 3]) {
        expect(remainingAt(progress, id, lines, level)).toEqual([]);
      }
    }

    for (const algorithmStats of Object.values(progress.stats)) {
      for (const stat of Object.values(algorithmStats)) {
        expect(stat.misses).toBe(0);
        expect(stat.attempts).toBeGreaterThan(0);
      }
    }
  });

  it("still completes when every answer is wrong, recording each miss", () => {
    const config = configOf({
      deck: DECK,
      mode: "type",
      minBlanks: 2,
      maxBlanks: 3,
      includeDistractors: false,
    });
    const sources = realSources();
    const rng = seededRng(7);
    const MAX_ROUNDS = 600;

    let progress = createProgress(config);
    let rounds = 0;

    while (!progress.completed && rounds < MAX_ROUNDS) {
      const round = requireRound(pickRound({ config, progress, sources, rng }));
      const grade = gradeRound(round, {});

      expect(grade.allCorrect).toBe(false);
      progress = recordRound(progress, round, grade, config, sources);
      rounds += 1;
    }

    expect(rounds).toBeLessThan(MAX_ROUNDS);
    expect(progress.completed).toBe(true);
    expect(progress.level).toBe(3);
    expect(coverageRatio(progress, sources, config)).toBe(1);

    for (const algorithmStats of Object.values(progress.stats)) {
      for (const stat of Object.values(algorithmStats)) {
        expect(stat.misses).toBe(stat.attempts);
      }
    }
  });
});
