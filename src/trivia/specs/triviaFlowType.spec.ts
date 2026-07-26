import { describe, expect, it } from "vitest";
import {
  blankableLines,
  createProgress,
  gradeRound,
  parsePuzzleLines,
  pickRound,
  recordRound,
  type Rng,
} from "../triviaEngine";
import type { PuzzleLine, TriviaConfig } from "../../types/trivia";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";

const DECK = ["two-sum", "bubble-sort", "binary-search-matrix", "bfs-graph"] as const;
const MAX_ROUNDS = 800;

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

const definitionOf = (id: string) => {
  const definition = ALGORITHM_REGISTRY[id];
  if (!definition) throw new Error(`registry is missing "${id}"`);
  return definition;
};

const realSources = (): Map<string, readonly PuzzleLine[]> =>
  new Map(
    DECK.map((id) => {
      const definition = definitionOf(id);
      return [id, parsePuzzleLines(definition.code, definition.trivia)];
    }),
  );

const configOf = (patch: Partial<TriviaConfig>): TriviaConfig => ({
  deck: [...DECK],
  mode: "choice",
  minBlanks: 1,
  maxBlanks: 3,
  includeDistractors: true,
  ...patch,
});

const contentOf = (lines: readonly PuzzleLine[], line: number): string => {
  const found = lines.find((candidate) => candidate.number === line);
  if (!found) throw new Error(`line ${line} is not in the solution`);
  return found.content;
};

const correctAnswersFor = (
  lines: readonly PuzzleLine[],
  blanks: readonly number[],
): Record<number, string> => {
  const answers: Record<number, string> = {};
  blanks.forEach((line) => {
    answers[line] = contentOf(lines, line);
  });
  return answers;
};

describe("trivia drill type flow and wrong answers", () => {
  it("completes a type-mode drill from a raised floor without distractor tiles", () => {
    const config = configOf({
      mode: "type",
      minBlanks: 2,
      maxBlanks: 4,
      includeDistractors: false,
    });
    const sources = realSources();
    const rng = seededRng(0x1337);

    let progress = createProgress(config);
    const algorithmsSeen = new Set<string>();
    const levelsSeen: number[] = [progress.level];
    let rounds = 0;

    expect(progress.level).toBe(2);

    while (!progress.completed && rounds < MAX_ROUNDS) {
      const round = pickRound({ config, progress, sources, rng });
      if (round === null) throw new Error(`pickRound went dry after ${rounds} rounds`);

      const lines = sources.get(round.algorithmId);
      if (lines === undefined) throw new Error(`round left the deck: ${round.algorithmId}`);
      algorithmsSeen.add(round.algorithmId);

      expect(round.tiles).toEqual([]);
      const blankable = new Set(blankableLines(lines));
      round.blanks.forEach((line) => expect(blankable.has(line)).toBe(true));

      const grade = gradeRound(round, correctAnswersFor(lines, round.blanks));
      expect(grade.allCorrect).toBe(true);

      const next = recordRound(progress, round, grade, config, sources);
      if (next.level !== progress.level) levelsSeen.push(next.level);
      progress = next;
      rounds += 1;
    }

    expect(rounds).toBeLessThan(MAX_ROUNDS);
    expect(progress.completed).toBe(true);
    expect(levelsSeen).toEqual([2, 3, 4]);
    expect([...algorithmsSeen].sort()).toEqual([...DECK].sort());
  });

  it("keeps drilling every algorithm when every answer is wrong", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 2 });
    const sources = realSources();
    const rng = seededRng(0xfeed);

    let progress = createProgress(config);
    const algorithmsSeen = new Set<string>();
    let rounds = 0;

    while (!progress.completed && rounds < MAX_ROUNDS) {
      const round = pickRound({ config, progress, sources, rng });
      if (round === null) throw new Error(`pickRound went dry after ${rounds} rounds`);
      algorithmsSeen.add(round.algorithmId);

      const grade = gradeRound(round, {});
      expect(grade.allCorrect).toBe(false);
      progress = recordRound(progress, round, grade, config, sources);
      rounds += 1;
    }

    expect(rounds).toBeLessThan(MAX_ROUNDS);
    expect(progress.completed).toBe(true);
    expect([...algorithmsSeen].sort()).toEqual([...DECK].sort());

    for (const id of DECK) {
      const stats = progress.stats[id];
      expect(stats).toBeDefined();
      for (const stat of Object.values(stats)) {
        expect(stat.misses).toBe(stat.attempts);
      }
    }
  });
});
