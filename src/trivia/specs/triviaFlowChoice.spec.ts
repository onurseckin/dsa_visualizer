import { describe, expect, it } from "vitest";
import {
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
import type { PuzzleLine, TriviaConfig, TriviaMeta } from "../../types/trivia";
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

const realMeta = (): Map<string, TriviaMeta | undefined> =>
  new Map(DECK.map((id) => [id, definitionOf(id).trivia]));

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

describe("trivia drill choice flow", () => {
  it("runs every round against blankable lines and grades truth from falsehood", () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = realSources();
    const meta = realMeta();
    const rng = seededRng(0x4b1d);

    let progress = createProgress(config);
    const levelsSeen: number[] = [progress.level];
    const algorithmsSeen = new Set<string>();
    let rounds = 0;

    expect(sources.size).toBe(4);
    expect(progress.level).toBe(config.minBlanks);

    while (!progress.completed && rounds < MAX_ROUNDS) {
      const round = pickRound({ config, progress, sources, meta, rng });
      if (round === null) throw new Error(`pickRound went dry after ${rounds} rounds`);

      const lines = sources.get(round.algorithmId);
      if (lines === undefined) throw new Error(`round left the deck: ${round.algorithmId}`);
      algorithmsSeen.add(round.algorithmId);

      const blankable = new Set(blankableLines(lines));
      expect(round.blanks).toHaveLength(round.level);
      expect(new Set(round.blanks).size).toBe(round.level);
      expect([...round.blanks].sort((a, b) => a - b)).toEqual(round.blanks);
      round.blanks.forEach((line) => {
        expect(blankable.has(line)).toBe(true);
        expect(contentOf(lines, line).trim().length).toBeGreaterThan(0);
      });
      expect(round.level).toBe(progress.level);

      const trayTexts = round.tiles.map((tile) => tile.text);
      round.blanks.forEach((line) => {
        expect(trayTexts).toContain(contentOf(lines, line));
      });

      const truth = correctAnswersFor(lines, round.blanks);
      const grade = gradeRound(round, truth);
      expect(grade.allCorrect).toBe(true);
      round.blanks.forEach((line) => {
        expect(grade.perBlank[line]).toBe(true);
      });

      const spoiled = round.blanks[0];
      const wrongGrade = gradeRound(round, {
        ...truth,
        [spoiled]: `${truth[spoiled]}  # not this`,
      });
      expect(wrongGrade.allCorrect).toBe(false);
      expect(wrongGrade.perBlank[spoiled]).toBe(false);
      round.blanks
        .filter((line) => line !== spoiled)
        .forEach((line) => {
          expect(wrongGrade.perBlank[line]).toBe(true);
        });
      expect(gradeRound(round, {}).allCorrect).toBe(false);

      const next = recordRound(progress, round, grade, config, sources);
      expect(next.level).toBeGreaterThanOrEqual(progress.level);
      if (next.level !== progress.level) {
        expect(next.level).toBe(progress.level + 1);
        levelsSeen.push(next.level);
      }

      progress = next;
      rounds += 1;
    }

    expect(rounds).toBeLessThan(MAX_ROUNDS);
    expect(progress.completed).toBe(true);
    expect(levelsSeen).toEqual([1, 2, 3]);
    expect(progress.roundsPlayed).toBe(rounds);

    expect([...algorithmsSeen].sort()).toEqual([...DECK].sort());

    expect(coverageRatio(progress, sources, config)).toBe(1);
    for (const [id, lines] of sources) {
      for (const level of [1, 2, 3]) {
        expect(remainingAt(progress, id, lines, level)).toEqual([]);
      }
    }
    expect(pickRound({ config, progress, sources, meta, rng })).toBeNull();
  });
});
