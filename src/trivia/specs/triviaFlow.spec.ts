import { describe, expect, it } from 'vitest';
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
} from '../triviaEngine';
import type { PuzzleLine, TriviaConfig, TriviaMeta } from '../../types/trivia';
import { ALGORITHM_REGISTRY } from '../../algorithms/registry';

/* End-to-end proof that the drill works across four *different* questions.
 *
 * Nothing here is a fixture: the deck is read out of the real registry, so if an
 * author edits a solution or its trivia metadata this spec is what notices. The
 * rng is seeded, never Math.random, so a failure replays exactly.
 *
 * The properties under test are the ones a broken drill would violate silently:
 * a round can only hide lines that are actually blankable, the truth grades as
 * correct and anything else does not, the level escalates minBlanks -> maxBlanks
 * without skipping a rung, every deck entry gets its turn, and the loop
 * terminates instead of re-drilling one lucky solution forever.
 */

const DECK = ['two-sum', 'bubble-sort', 'binary-search-matrix', 'bfs-graph'] as const;

/* A converging drill needs roughly one round per (line, level) pair; this bound is
   an order of magnitude above that, so reaching it means the loop stopped
   progressing rather than that the deck was simply large. */
const MAX_ROUNDS = 800;

/** mulberry32 — seeded and stable across runs, so the whole loop is replayable. */
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
  mode: 'choice',
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

describe('trivia drill over four real algorithms', () => {
  it('runs every round against blankable lines and grades truth from falsehood', () => {
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

      // The round can only ever hide lines the author left drillable.
      const blankable = new Set(blankableLines(lines));
      expect(round.blanks).toHaveLength(round.level);
      expect(new Set(round.blanks).size).toBe(round.level);
      expect([...round.blanks].sort((a, b) => a - b)).toEqual(round.blanks);
      round.blanks.forEach((line) => {
        expect(blankable.has(line)).toBe(true);
        expect(contentOf(lines, line).trim().length).toBeGreaterThan(0);
      });
      expect(round.level).toBe(progress.level);

      // Choice mode has to be solvable: every blank needs a tile carrying its truth.
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

      /* A wrong answer must fail, and fail only where it is wrong: grading the whole
         round as bad because one blank slipped would corrupt the miss weighting. */
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
      // An empty submission is a miss too, which is what a revealed line submits.
      expect(gradeRound(round, {}).allCorrect).toBe(false);

      const next = recordRound(progress, round, grade, config, sources);
      expect(next.level).toBeGreaterThanOrEqual(progress.level);
      // Escalation is one rung at a time; a jump would leave a level undrilled.
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

    // Four questions, not one question four times.
    expect([...algorithmsSeen].sort()).toEqual([...DECK].sort());

    expect(coverageRatio(progress, sources, config)).toBe(1);
    for (const [id, lines] of sources) {
      for (const level of [1, 2, 3]) {
        expect(remainingAt(progress, id, lines, level)).toEqual([]);
      }
    }
    expect(pickRound({ config, progress, sources, meta, rng })).toBeNull();
  });

  it('completes a type-mode drill from a raised floor without distractor tiles', () => {
    const config = configOf({
      mode: 'type',
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

  it('keeps drilling every algorithm when every answer is wrong', () => {
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

    // A missed line is weighted to return, so nothing is quietly skipped.
    for (const id of DECK) {
      const stats = progress.stats[id];
      expect(stats).toBeDefined();
      for (const stat of Object.values(stats)) {
        expect(stat.misses).toBe(stat.attempts);
      }
    }
  });
});

describe('authored trivia metadata stays in range', () => {
  it.each([...DECK])('%s references only real, drillable lines', (id) => {
    const definition = definitionOf(id);
    const trivia = definition.trivia;
    expect(trivia).toBeDefined();
    if (trivia === undefined) return;

    const lines = parsePuzzleLines(definition.code, trivia);
    const blankable = new Set(blankableLines(lines));

    (trivia.skipLines ?? []).forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      // A skipped line must actually be excluded, or the author's intent is lost.
      expect(blankable.has(line)).toBe(false);
    });

    /* A hint on a line the drill never hides can never be shown, so an off-by-one
       here is invisible in the UI — this is the only place it surfaces. */
    (trivia.hints ?? []).forEach((entry) => {
      expect(entry.line).toBeGreaterThanOrEqual(1);
      expect(entry.line).toBeLessThanOrEqual(lines.length);
      expect(blankable.has(entry.line)).toBe(true);
      expect(entry.hint.trim().length).toBeGreaterThan(0);
    });
    expect(new Set((trivia.hints ?? []).map((entry) => entry.line)).size).toBe(
      (trivia.hints ?? []).length,
    );
  });

  it.each([...DECK])('%s has no distractor that is really a correct line', (id) => {
    const definition = definitionOf(id);
    const distractors = definition.trivia?.distractors ?? [];
    const real = new Set(
      definition.code
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    );

    expect(distractors.length).toBeGreaterThan(0);
    distractors.forEach((distractor) => {
      expect(distractor.trim().length).toBeGreaterThan(0);
      // Grading is trim-compared, so a distractor differing only by indentation
      // would be a "wrong" tile that grades as correct.
      expect(real.has(distractor.trim())).toBe(false);
    });
    expect(new Set(distractors.map((entry) => entry.trim())).size).toBe(distractors.length);
  });
});
