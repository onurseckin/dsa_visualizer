import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRIVIA_CONFIG,
  MAX_BLANKS_CEILING,
  MIN_BLANKS_FLOOR,
  blankableLines,
  buildTiles,
  coverageRatio,
  createProgress,
  describeMode,
  gradeRound,
  isAnswerCorrect,
  isLevelCovered,
  normalizeConfig,
  parsePuzzleLines,
  pickRound,
  recordRound,
  remainingAt,
  type Rng,
} from '../triviaEngine';
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
} from '../../types/trivia';
import { ALGORITHM_REGISTRY } from '../../algorithms/registry';

/* Every rng below is injected and deterministic. Math.random must never appear in
   this file: the escalation rules are only meaningful if a failing run replays. */

/** Walks a fixed script and throws when a test consumes more draws than it declared. */
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

/** rng()===0 always takes the first candidate, which makes picks readable. */
const zeroRng = (): Rng => () => 0;

/** mulberry32 — seeded, stable across runs, so the end-to-end loop is replayable. */
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
  new Map(
    Object.entries(codeById).map(([id, code]) => [id, parsePuzzleLines(code, metaById[id])]),
  );

const linesFor = (
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
  id: string,
): readonly PuzzleLine[] => {
  const lines = sources.get(id);
  if (!lines) throw new Error(`spec fixture is missing source "${id}"`);
  return lines;
};

const requireRound = (round: TriviaRound | null): TriviaRound => {
  if (!round) throw new Error('expected pickRound to produce a round');
  return round;
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

const correctAnswers = (round: TriviaRound): Record<number, string> => {
  const answers: Record<number, string> = {};
  round.blanks.forEach((number) => {
    const line = round.lines.find((candidate) => candidate.number === number);
    answers[number] = line ? line.content : '';
  });
  return answers;
};

const texts = (round: TriviaRound): string[] => round.tiles.map((tile) => tile.text);

/* --- fixtures ------------------------------------------------------------- */

const SIMPLE_CODE = [
  'def f(n):',
  '    total = 0',
  '',
  '    for i in range(n):',
  '        total += i',
  '    return total',
].join('\n');

// 9 distinct blankable lines: long enough for a 3-blank tray to be uncapped.
const LONG_CODE = [
  'def solve(nums):',
  '    total = 0',
  '    best = 0',
  '    for num in nums:',
  '        total += num',
  '        best = max(best, total)',
  '    if best < 0:',
  '        best = 0',
  '    return best',
].join('\n');

const TWO_LINE_A = 'a = 1\nb = 2';
const TWO_LINE_B = 'c = 3\nd = 4';
const THREE_LINE = 'x = 1\ny = 2\nz = 3';
const ONE_LINE = 'only = 1';

// Mirrors binary-search-matrix, which really does hold `return False` twice.
const REPEATED_RETURN_CODE = ['if not matrix:', '    return False', 'return False'].join('\n');

describe('parsePuzzleLines', () => {
  it('numbers lines from 1 and splits indentation from content', () => {
    const lines = parsePuzzleLines(SIMPLE_CODE);

    expect(lines).toHaveLength(6);
    expect(lines[0]).toEqual({
      number: 1,
      text: 'def f(n):',
      indent: '',
      content: 'def f(n):',
      blankable: true,
    });
    expect(lines[4]).toEqual({
      number: 5,
      text: '        total += i',
      indent: '        ',
      content: 'total += i',
      blankable: true,
    });
  });

  it('never marks a blank line blankable', () => {
    const lines = parsePuzzleLines(SIMPLE_CODE);

    expect(lines[2]).toEqual({
      number: 3,
      text: '',
      indent: '',
      content: '',
      blankable: false,
    });
  });

  it('never marks a whitespace-only line blankable and keeps its spaces as indent', () => {
    const lines = parsePuzzleLines('a = 1\n   \nb = 2');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual({
      number: 2,
      text: '   ',
      indent: '   ',
      content: '',
      blankable: false,
    });
    expect(blankableLines(lines)).toEqual([1, 3]);
  });

  it('excludes meta.skipLines from blankable while keeping the line present', () => {
    const lines = parsePuzzleLines(SIMPLE_CODE, { skipLines: [1, 6] });

    expect(lines).toHaveLength(6);
    expect(lines[0].content).toBe('def f(n):');
    expect(lines[0].blankable).toBe(false);
    expect(lines[5].blankable).toBe(false);
    expect(blankableLines(lines)).toEqual([2, 4, 5]);
  });

  it('ignores skipLines that point past the end of the solution', () => {
    const lines = parsePuzzleLines(THREE_LINE, { skipLines: [99] });

    expect(blankableLines(lines)).toEqual([1, 2, 3]);
  });

  it('drops a trailing newline instead of emitting a phantom final line', () => {
    expect(parsePuzzleLines('a = 1\nb = 2\n')).toEqual(parsePuzzleLines('a = 1\nb = 2'));
  });

  it('keeps the last line drillable when the code has no trailing newline', () => {
    const lines = parsePuzzleLines('a = 1\n    return a');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toEqual({
      number: 2,
      text: '    return a',
      indent: '    ',
      content: 'return a',
      blankable: true,
    });
  });

  it('strips trailing blank and whitespace-only lines at the end of the file', () => {
    const lines = parsePuzzleLines('a = 1\nb = 2\n   \n\n');

    expect(lines).toHaveLength(2);
    expect(blankableLines(lines)).toEqual([1, 2]);
  });

  it('collapses whitespace-only input to a single non-blankable line', () => {
    const lines = parsePuzzleLines('   \n\t\n  ');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      number: 1,
      text: '',
      indent: '',
      content: '',
      blankable: false,
    });
    expect(blankableLines(lines)).toEqual([]);
  });

  it('yields no blankable lines for an empty string', () => {
    expect(blankableLines(parsePuzzleLines(''))).toEqual([]);
  });

  it('keeps trailing spaces inside a mid-file line as content, not as a stripped edge', () => {
    const lines = parsePuzzleLines('a = 1  \nb = 2');

    expect(lines[0].content).toBe('a = 1  ');
  });
});

describe('normalizeConfig', () => {
  it('clamps minBlanks up to the floor', () => {
    expect(normalizeConfig(configOf({ minBlanks: 0, maxBlanks: 3 })).minBlanks).toBe(
      MIN_BLANKS_FLOOR,
    );
    expect(normalizeConfig(configOf({ minBlanks: -7, maxBlanks: 3 })).minBlanks).toBe(
      MIN_BLANKS_FLOOR,
    );
  });

  it('clamps minBlanks down to the ceiling and drags maxBlanks with it', () => {
    const normalized = normalizeConfig(
      configOf({ minBlanks: MAX_BLANKS_CEILING + 500, maxBlanks: 3 }),
    );

    expect(normalized.minBlanks).toBe(MAX_BLANKS_CEILING);
    expect(normalized.maxBlanks).toBe(MAX_BLANKS_CEILING);
  });

  it('never lets maxBlanks fall below minBlanks', () => {
    expect(normalizeConfig(configOf({ minBlanks: 4, maxBlanks: 2 }))).toMatchObject({
      minBlanks: 4,
      maxBlanks: 4,
    });
    expect(normalizeConfig(configOf({ minBlanks: 4, maxBlanks: -100 }))).toMatchObject({
      minBlanks: 4,
      maxBlanks: 4,
    });
  });

  it('clamps an out-of-range maxBlanks to the ceiling', () => {
    expect(normalizeConfig(configOf({ minBlanks: 1, maxBlanks: 500 })).maxBlanks).toBe(
      MAX_BLANKS_CEILING,
    );
  });

  // Corrupted persisted settings are the realistic source of these; falling back to
  // the lower bound keeps the drill playable instead of producing NaN blanks.
  it('falls back to the lower bound for non-finite values', () => {
    expect(normalizeConfig(configOf({ minBlanks: Number.NaN, maxBlanks: 3 }))).toMatchObject({
      minBlanks: MIN_BLANKS_FLOOR,
      maxBlanks: 3,
    });
    expect(
      normalizeConfig(configOf({ minBlanks: 2, maxBlanks: Number.POSITIVE_INFINITY })),
    ).toMatchObject({ minBlanks: 2, maxBlanks: 2 });
    expect(
      normalizeConfig(configOf({ minBlanks: Number.NEGATIVE_INFINITY, maxBlanks: Number.NaN })),
    ).toMatchObject({ minBlanks: MIN_BLANKS_FLOOR, maxBlanks: MIN_BLANKS_FLOOR });
  });

  it('rounds fractional values to whole blanks', () => {
    expect(normalizeConfig(configOf({ minBlanks: 2.4, maxBlanks: 3.5 }))).toMatchObject({
      minBlanks: 2,
      maxBlanks: 4,
    });
  });

  it('preserves every other field and leaves the input untouched', () => {
    const config = configOf({
      deck: ['two-sum'],
      mode: 'type',
      includeDistractors: false,
      minBlanks: 0,
      maxBlanks: MAX_BLANKS_CEILING + 500,
    });
    const before = JSON.stringify(config);

    expect(normalizeConfig(config)).toEqual({
      deck: ['two-sum'],
      mode: 'type',
      includeDistractors: false,
      minBlanks: MIN_BLANKS_FLOOR,
      maxBlanks: MAX_BLANKS_CEILING,
    });
    expect(JSON.stringify(config)).toBe(before);
  });
});

describe('createProgress', () => {
  it('starts at the normalized floor with an empty history', () => {
    expect(createProgress(configOf({ minBlanks: 2, maxBlanks: 5 }))).toEqual({
      level: 2,
      drilled: {},
      stats: {},
      completed: false,
      roundsPlayed: 0,
    });
  });

  it('normalizes a garbage floor before using it as the starting level', () => {
    expect(createProgress(configOf({ minBlanks: 0, maxBlanks: 3 })).level).toBe(MIN_BLANKS_FLOOR);
  });
});

describe('pickRound', () => {
  it('returns null on an empty deck', () => {
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

  it('returns null once the drill is completed', () => {
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

  it('returns null when no deck entry has enough blankable lines for the level', () => {
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

  it('hides exactly `level` lines, ascending, unique and all blankable', () => {
    const config = configOf({ minBlanks: 3, maxBlanks: 3, mode: 'type' });
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

  it('reports the full solution as a copy so callers cannot mutate the source', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: 'type' });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const lines = linesFor(sources, 'alpha');
    const round = requireRound(
      pickRound({ config, progress: createProgress(config), sources, rng: zeroRng() }),
    );

    expect(round.lines).toEqual(lines);
    expect(round.lines).not.toBe(lines);
  });

  it('skips algorithms with fewer blankable lines than the level', () => {
    const config = configOf({ minBlanks: 3, maxBlanks: 3, mode: 'type' });
    // `tiny` is first in insertion order, so a naive rng-only pick would choose it.
    const sources = sourcesOf({ tiny: TWO_LINE_A, alpha: LONG_CODE });

    for (const seed of [1, 5, 11, 23]) {
      const round = requireRound(
        pickRound({ config, progress: createProgress(config), sources, rng: seededRng(seed) }),
      );

      expect(round.algorithmId).toBe('alpha');
    }
  });

  it('prefers an algorithm with uncovered lines over one the rng would otherwise pick', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
    const sources = sourcesOf({ alpha: TWO_LINE_A, beta: TWO_LINE_B });
    const fresh = createProgress(config);

    // rng 0 selects pool index 0, which is `alpha` while both are uncovered.
    expect(
      requireRound(pickRound({ config, progress: fresh, sources, rng: zeroRng() })).algorithmId,
    ).toBe('alpha');

    const alphaDone = withDrilled(fresh, 'alpha', 1, [1, 2]);

    expect(
      requireRound(pickRound({ config, progress: alphaDone, sources, rng: zeroRng() })).algorithmId,
    ).toBe('beta');
  });

  it('falls back to every eligible algorithm once the level is fully covered', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const covered = withDrilled(createProgress(config), 'alpha', 1, [1, 2]);
    const round = requireRound(pickRound({ config, progress: covered, sources, rng: zeroRng() }));

    expect(round.algorithmId).toBe('alpha');
    expect(round.blanks).toHaveLength(1);
  });

  it('prefers undrilled lines before re-using drilled ones', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const progress = withDrilled(createProgress(config), 'alpha', 1, [1, 2, 4]);

    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const round = requireRound(pickRound({ config, progress, sources, rng: seededRng(seed) }));

      expect([5, 6]).toContain(round.blanks[0]);
    }
  });

  it('tops up from already-drilled lines when fewer than `level` remain undrilled', () => {
    const config = configOf({ minBlanks: 2, maxBlanks: 3, mode: 'type' });
    const sources = sourcesOf({ alpha: SIMPLE_CODE });
    const progress = withDrilled(createProgress(config), 'alpha', 2, [1, 2, 4, 5]);

    for (const seed of [1, 2, 3, 9, 17]) {
      const round = requireRound(pickRound({ config, progress, sources, rng: seededRng(seed) }));

      expect(round.blanks).toHaveLength(2);
      expect(new Set(round.blanks).size).toBe(2);
      expect(round.blanks).toContain(6);
      expect([1, 2, 4, 5]).toContain(round.blanks.find((n) => n !== 6));
    }
  });

  it('clamps a stored level into the configured range', () => {
    const sources = sourcesOf({ alpha: LONG_CODE });
    const highConfig = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
    const lowConfig = configOf({ minBlanks: 2, maxBlanks: 4, mode: 'type' });

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

  it('returns tiles only in choice mode', () => {
    const sources = sourcesOf({ alpha: LONG_CODE });
    const choice = configOf({ minBlanks: 2, maxBlanks: 2, mode: 'choice' });
    const type = configOf({ minBlanks: 2, maxBlanks: 2, mode: 'type' });

    const choiceRound = requireRound(
      pickRound({ config: choice, progress: createProgress(choice), sources, rng: zeroRng() }),
    );
    const typeRound = requireRound(
      pickRound({ config: type, progress: createProgress(type), sources, rng: zeroRng() }),
    );

    expect(choiceRound.tiles).toHaveLength(4);
    expect(typeRound.tiles).toEqual([]);
  });

  it('omits author distractors from the tray when includeDistractors is off', () => {
    // Both blankable lines are blanked, so authored decoys are the only possible source.
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const meta = new Map<string, TriviaMeta | undefined>([
      ['alpha', { distractors: ['a = 2', 'b = 1'] }],
    ]);
    const on = configOf({ minBlanks: 2, maxBlanks: 2, mode: 'choice', includeDistractors: true });
    const off = configOf({ minBlanks: 2, maxBlanks: 2, mode: 'choice', includeDistractors: false });

    const withDistractors = requireRound(
      pickRound({ config: on, progress: createProgress(on), sources, meta, rng: zeroRng() }),
    );
    const withoutDistractors = requireRound(
      pickRound({ config: off, progress: createProgress(off), sources, meta, rng: zeroRng() }),
    );

    expect(texts(withDistractors).sort()).toEqual(['a = 1', 'a = 2', 'b = 1', 'b = 2']);
    expect(texts(withoutDistractors).sort()).toEqual(['a = 1', 'b = 2']);
  });
});

describe('pickRound weighted recall', () => {
  /* One draw for the algorithm, one for the weighted ticket. The two cases below
     share the identical script, so any difference is caused by the miss record. */
  const SCRIPT = [0, 0.5];

  it('picks the clean line when no line has been missed', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: 'type' });
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

  it('surfaces a missed line ahead of an equally-eligible clean line', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: 'type' });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const progress = withMisses(createProgress(config), 'alpha', 2, 4);
    const round = requireRound(
      pickRound({ config, progress, sources, rng: scriptedRng(SCRIPT) }),
    );

    expect(round.blanks).toEqual([2]);
  });

  it('still reaches a clean line eventually, so known lines are never starved', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 1, mode: 'type' });
    const sources = sourcesOf({ alpha: TWO_LINE_A });
    const progress = withMisses(createProgress(config), 'alpha', 2, 20);
    const rng = seededRng(4);
    const picked = new Set<number>();

    for (let i = 0; i < 60; i += 1) {
      picked.add(requireRound(pickRound({ config, progress, sources, rng })).blanks[0]);
    }

    expect(picked).toEqual(new Set([1, 2]));
  });
});

describe('buildTiles', () => {
  it('emits one answer tile per blank, carrying the line content and its number', () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [2, 5], undefined, zeroRng());
    const answers = tiles.filter((tile) => tile.correctFor !== null);

    expect(answers).toHaveLength(2);
    expect(answers.find((tile) => tile.correctFor === 2)?.text).toBe('total = 0');
    expect(answers.find((tile) => tile.correctFor === 5)?.text).toBe('total += num');
  });

  it('draws decoys from other real lines of the same solution with correctFor null', () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [2, 5], undefined, seededRng(11));
    const decoys = tiles.filter((tile) => tile.correctFor === null);
    const spareContent = lines
      .filter((line) => line.blankable && line.number !== 2 && line.number !== 5)
      .map((line) => line.content);

    expect(decoys).toHaveLength(2);
    decoys.forEach((decoy) => expect(spareContent).toContain(decoy.text));
  });

  it('never uses a blanked line or a non-blankable line as a decoy', () => {
    const lines = parsePuzzleLines(SIMPLE_CODE, { skipLines: [1] });
    const tiles = buildTiles(lines, [2], undefined, seededRng(3));

    expect(texts({ ...roundOf('alpha', lines, [2]), tiles })).not.toContain('def f(n):');
    expect(tiles.filter((tile) => tile.text === 'total = 0')).toHaveLength(1);
    expect(tiles.some((tile) => tile.text === '')).toBe(false);
  });

  it('includes author distractors when the decoy pool is otherwise empty', () => {
    const lines = parsePuzzleLines(TWO_LINE_A);
    const meta: TriviaMeta = { distractors: ['a = 99', 'b = 99'] };
    const tiles = buildTiles(lines, [1, 2], meta, seededRng(8));
    const decoys = tiles.filter((tile) => tile.correctFor === null).map((tile) => tile.text);

    expect(decoys.sort()).toEqual(['a = 99', 'b = 99']);
  });

  it('adds no decoys at all when neither spare lines nor distractors exist', () => {
    const lines = parsePuzzleLines(TWO_LINE_A);
    const tiles = buildTiles(lines, [1, 2], undefined, seededRng(8));

    expect(tiles).toHaveLength(2);
    expect(tiles.every((tile) => tile.correctFor !== null)).toBe(true);
  });

  it('keeps the tray proportional to the blanks: one decoy per blank', () => {
    const lines = parsePuzzleLines(LONG_CODE);

    expect(buildTiles(lines, [1], undefined, seededRng(2))).toHaveLength(2);
    expect(buildTiles(lines, [1, 2], undefined, seededRng(2))).toHaveLength(4);
    expect(buildTiles(lines, [1, 2, 3], undefined, seededRng(2))).toHaveLength(6);
  });

  it('caps the decoy count by what the solution can actually supply', () => {
    const lines = parsePuzzleLines(THREE_LINE);
    const tiles = buildTiles(lines, [1, 2], undefined, seededRng(5));

    expect(tiles).toHaveLength(3);
    expect(tiles.filter((tile) => tile.correctFor === null)).toHaveLength(1);
  });

  it('collapses duplicate decoy candidates instead of showing the same tile twice', () => {
    const lines = parsePuzzleLines('target = 1\n    left += 1\n    left += 1\nreturn target');
    const tiles = buildTiles(lines, [1, 4], undefined, seededRng(6));

    expect(new Set(texts({ ...roundOf('alpha', lines, [1, 4]), tiles }))).toHaveLength(tiles.length);
  });

  it('grades either tile when a spare line repeats the answer verbatim', () => {
    /* `return False` really does appear twice in binary-search-matrix, so the spare
       copy can legitimately surface as a decoy whose text equals the answer's. That
       is harmless precisely because grading compares content and not tile identity —
       the learner is never punished for picking the indistinguishable tile. */
    const lines = parsePuzzleLines(REPEATED_RETURN_CODE);
    const tiles = buildTiles(lines, [2], undefined, zeroRng());
    const round = { ...roundOf('alpha', lines, [2]), tiles };

    tiles
      .filter((tile) => tile.text === 'return False')
      .forEach((tile) => {
        expect(gradeRound(round, { 2: tile.text }).allCorrect).toBe(true);
      });
    expect(tiles.filter((tile) => tile.correctFor === 2)).toHaveLength(1);
  });

  it('gives every tile a unique id', () => {
    const lines = parsePuzzleLines(LONG_CODE);
    const tiles = buildTiles(lines, [1, 4, 7], { distractors: ['nope = 1'] }, seededRng(13));

    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(tiles.length);
  });
});

describe('isAnswerCorrect', () => {
  it('ignores leading and trailing whitespace on both sides', () => {
    expect(isAnswerCorrect('   total = 0  ', 'total = 0')).toBe(true);
    expect(isAnswerCorrect('total = 0', '\ttotal = 0 ')).toBe(true);
  });

  it('collapses multiple internal spaces around an operator to a single space', () => {
    expect(isAnswerCorrect('x  =  1+1', 'x = 1+1')).toBe(true);
    expect(isAnswerCorrect('total   =   0', 'total = 0')).toBe(true);
  });

  it('collapses extra internal spacing inside array/tuple literals', () => {
    // The user's own example: "spacing inside of some array blocks ... or tuples"
    // should never fail an otherwise-correct line.
    expect(isAnswerCorrect('[1,  2,   3]', '[1, 2, 3]')).toBe(true);
    expect(isAnswerCorrect('(1,   2)', '(1, 2)')).toBe(true);
  });

  it('does not treat an entirely absent space the same as a present one', () => {
    // Design decision (documented): normalization only *collapses* a run of
    // whitespace that already exists; it never deletes a required separator
    // or invents one that isn't there. So "total=0" (no space at all around
    // the operator) is a genuinely different literal from "total = 0" (one
    // space), not just a spacing-amount difference — collapsing zero spaces
    // into one (or vice versa) would blur the line between "cosmetic spacing"
    // and "different code", which is exactly what this fix must not do.
    expect(isAnswerCorrect('total=0', 'total = 0')).toBe(false);
    expect(isAnswerCorrect('[1,2,3]', '[1, 2,3]')).toBe(false);
  });

  it('is case sensitive', () => {
    expect(isAnswerCorrect('Return total', 'return total')).toBe(false);
  });

  it('rejects an empty submission for a real line', () => {
    expect(isAnswerCorrect('', 'return total')).toBe(false);
    expect(isAnswerCorrect('   ', 'return total')).toBe(false);
  });

  it('still fails a genuine mismatch even after whitespace normalization', () => {
    // Different variable name — extra spacing must not paper over real content changes.
    expect(isAnswerCorrect('count  =  0', 'total = 0')).toBe(false);
    // Different operator.
    expect(isAnswerCorrect('x  +  1', 'x - 1')).toBe(false);
  });
});

describe('gradeRound', () => {
  const lines = parsePuzzleLines(SIMPLE_CODE);

  it('grades each blank against the line content, ignoring indentation', () => {
    const round = roundOf('alpha', lines, [2, 5]);
    const grade = gradeRound(round, { 2: 'total = 0', 5: '        total += i' });

    expect(grade).toEqual({ perBlank: { 2: true, 5: true }, allCorrect: true });
  });

  it('counts a missing answer as wrong', () => {
    const round = roundOf('alpha', lines, [2, 5]);
    const grade = gradeRound(round, { 2: 'total = 0' });

    expect(grade.perBlank[5]).toBe(false);
    expect(grade.allCorrect).toBe(false);
  });

  it('reports allCorrect only when every blank matches', () => {
    const round = roundOf('alpha', lines, [2, 4, 5]);

    expect(
      gradeRound(round, { 2: 'total = 0', 4: 'for i in range(n):', 5: 'total += i' }).allCorrect,
    ).toBe(true);
    expect(
      gradeRound(round, { 2: 'total = 0', 4: 'for i in range(m):', 5: 'total += i' }).allCorrect,
    ).toBe(false);
  });

  it('grades only the round blanks and ignores stray answer keys', () => {
    const round = roundOf('alpha', lines, [2]);
    const grade = gradeRound(round, { 2: 'total = 0', 4: 'garbage', 99: 'garbage' });

    expect(grade.perBlank).toEqual({ 2: true });
    expect(grade.allCorrect).toBe(true);
  });

  it('accepts a blank whose internal spacing differs only by extra whitespace', () => {
    const round = roundOf('alpha', lines, [4]);

    expect(gradeRound(round, { 4: 'for i  in range(n):' }).perBlank[4]).toBe(true);
  });

  it('still rejects a blank whose content genuinely differs, not just its spacing', () => {
    const round = roundOf('alpha', lines, [4]);

    expect(gradeRound(round, { 4: 'for i  in range(m):' }).perBlank[4]).toBe(false);
  });
});

describe('recordRound', () => {
  const config = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
  const sources = sourcesOf({ alpha: SIMPLE_CODE });
  const lines = linesFor(sources, 'alpha');

  it('marks the round blanks drilled at the round level', () => {
    const round = roundOf('alpha', lines, [2, 5], 2);
    const next = recordRound(createProgress(config), round, gradeOf([2, 5], [2, 5]), config, sources);

    expect(next.drilled.alpha).toEqual({ '2': [2, 5] });
    expect(next.roundsPlayed).toBe(1);
  });

  it('merges with previously drilled lines without duplicates and stays ascending', () => {
    const progress = withDrilled(createProgress(config), 'alpha', 2, [5, 1]);
    const round = roundOf('alpha', lines, [2, 5], 2);
    const next = recordRound(progress, round, gradeOf([2, 5], [2, 5]), config, sources);

    expect(next.drilled.alpha['2']).toEqual([1, 2, 5]);
  });

  it('records drilled lines per level, leaving other levels alone', () => {
    const progress = withDrilled(createProgress(config), 'alpha', 1, [1]);
    const round = roundOf('alpha', lines, [2, 4], 2);
    const next = recordRound(progress, round, gradeOf([2, 4], [2, 4]), config, sources);

    expect(next.drilled.alpha).toEqual({ '1': [1], '2': [2, 4] });
  });

  it('increments attempts for every blank but misses only for wrong answers', () => {
    const round = roundOf('alpha', lines, [2, 5], 2);
    const next = recordRound(createProgress(config), round, gradeOf([2, 5], [2]), config, sources);

    expect(next.stats.alpha).toEqual({
      '2': { attempts: 1, misses: 0 },
      '5': { attempts: 1, misses: 1 },
    });
  });

  it('accumulates per-line accuracy across rounds', () => {
    const round = roundOf('alpha', lines, [2], 1);
    const first = recordRound(createProgress(config), round, gradeOf([2], []), config, sources);
    const second = recordRound(first, round, gradeOf([2], [2]), config, sources);

    expect(second.stats.alpha['2']).toEqual({ attempts: 2, misses: 1 });
    expect(second.roundsPlayed).toBe(2);
  });

  it('does not advance the level while the deck still has uncovered lines', () => {
    const round = roundOf('alpha', lines, [2], 1);
    const next = recordRound(createProgress(config), round, gradeOf([2], [2]), config, sources);

    expect(next.level).toBe(1);
    expect(next.completed).toBe(false);
  });

  it('advances only once every algorithm of a multi-algorithm deck is covered', () => {
    const deckConfig = configOf({ minBlanks: 1, maxBlanks: 3, mode: 'type' });
    const deck = sourcesOf({ alpha: TWO_LINE_A, beta: TWO_LINE_B });
    const alpha = linesFor(deck, 'alpha');
    const beta = linesFor(deck, 'beta');
    let progress = createProgress(deckConfig);

    progress = recordRound(progress, roundOf('alpha', alpha, [1], 1), gradeOf([1], [1]), deckConfig, deck);
    expect(progress.level).toBe(1);

    progress = recordRound(progress, roundOf('alpha', alpha, [2], 1), gradeOf([2], [2]), deckConfig, deck);
    expect(progress.level).toBe(1);

    progress = recordRound(progress, roundOf('beta', beta, [1], 1), gradeOf([1], [1]), deckConfig, deck);
    expect(progress.level).toBe(1);

    progress = recordRound(progress, roundOf('beta', beta, [2], 1), gradeOf([2], [2]), deckConfig, deck);
    expect(progress.level).toBe(2);
    expect(progress.completed).toBe(false);

    progress = recordRound(
      progress,
      roundOf('alpha', alpha, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(2);

    progress = recordRound(
      progress,
      roundOf('beta', beta, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      deckConfig,
      deck,
    );
    expect(progress.level).toBe(3);
  });

  it('advances on a wrong round too, since a fumbled line still counts as drilled', () => {
    const soloConfig = configOf({ minBlanks: 1, maxBlanks: 2, mode: 'type' });
    const solo = sourcesOf({ tiny: ONE_LINE });
    const tiny = linesFor(solo, 'tiny');
    const next = recordRound(
      createProgress(soloConfig),
      roundOf('tiny', tiny, [1], 1),
      gradeOf([1], []),
      soloConfig,
      solo,
    );

    expect(next.level).toBe(2);
    expect(next.stats.tiny['1']).toEqual({ attempts: 1, misses: 1 });
  });

  it('treats an algorithm too short for the level as satisfied rather than blocking', () => {
    const mixedConfig = configOf({ minBlanks: 2, maxBlanks: 3, mode: 'type' });
    const mixed = sourcesOf({ tiny: ONE_LINE, alpha: TWO_LINE_A });
    const alpha = linesFor(mixed, 'alpha');
    const next = recordRound(
      createProgress(mixedConfig),
      roundOf('alpha', alpha, [1, 2], 2),
      gradeOf([1, 2], [1, 2]),
      mixedConfig,
      mixed,
    );

    expect(next.level).toBe(3);
  });

  it('sets completed when the ceiling level is covered and stops advancing', () => {
    const topConfig = configOf({ minBlanks: 3, maxBlanks: 3, mode: 'type' });
    const top = sourcesOf({ alpha: THREE_LINE });
    const alpha = linesFor(top, 'alpha');
    const round = roundOf('alpha', alpha, [1, 2, 3], 3);
    const done = recordRound(createProgress(topConfig), round, gradeOf([1, 2, 3], [1, 2, 3]), topConfig, top);

    expect(done).toMatchObject({ completed: true, level: 3 });

    const again = recordRound(done, round, gradeOf([1, 2, 3], [1, 2, 3]), topConfig, top);

    expect(again).toMatchObject({ completed: true, level: 3 });
    expect(again.roundsPlayed).toBe(2);
  });

  it('never mutates the progress it was given', () => {
    const progress: TriviaProgress = {
      ...withMisses(withDrilled(createProgress(config), 'alpha', 2, [1]), 'alpha', 1, 2),
      roundsPlayed: 4,
    };
    const before = JSON.stringify(progress);
    const round = roundOf('alpha', lines, [1, 2], 2);

    const next = recordRound(progress, round, gradeOf([1, 2], [1]), config, sources);

    expect(JSON.stringify(progress)).toBe(before);
    expect(progress.drilled.alpha['2']).toEqual([1]);
    expect(progress.stats.alpha['1']).toEqual({ attempts: 2, misses: 2 });
    expect(progress.roundsPlayed).toBe(4);
    expect(next).not.toBe(progress);
    expect(next.drilled).not.toBe(progress.drilled);
    expect(next.stats).not.toBe(progress.stats);
    expect(next.drilled.alpha['2']).toEqual([1, 2]);
  });

  it('does not mutate the round it folds in', () => {
    const round = roundOf('alpha', lines, [4, 5], 2);
    const before = JSON.stringify(round);

    recordRound(createProgress(config), round, gradeOf([4, 5], [4, 5]), config, sources);

    expect(JSON.stringify(round)).toBe(before);
  });
});

describe('remainingAt and isLevelCovered', () => {
  const config = configOf({ minBlanks: 1, maxBlanks: 3 });
  const sources = sourcesOf({ alpha: SIMPLE_CODE, beta: TWO_LINE_B });
  const alpha = linesFor(sources, 'alpha');

  it('lists every blankable line, ascending, on fresh progress', () => {
    expect(remainingAt(createProgress(config), 'alpha', alpha, 1)).toEqual([1, 2, 4, 5, 6]);
  });

  it('excludes lines drilled at that level only', () => {
    const progress = withDrilled(createProgress(config), 'alpha', 1, [2, 5]);

    expect(remainingAt(progress, 'alpha', alpha, 1)).toEqual([1, 4, 6]);
    expect(remainingAt(progress, 'alpha', alpha, 2)).toEqual([1, 2, 4, 5, 6]);
  });

  it('ignores drilled records belonging to a different algorithm', () => {
    const progress = withDrilled(createProgress(config), 'beta', 1, [1, 2]);

    expect(remainingAt(progress, 'alpha', alpha, 1)).toEqual([1, 2, 4, 5, 6]);
  });

  it('reports a level uncovered while any deck entry has lines left', () => {
    const progress = withDrilled(createProgress(config), 'alpha', 1, [1, 2, 4, 5, 6]);

    expect(isLevelCovered(progress, sources, 1)).toBe(false);
  });

  it('reports a level covered once every deck entry is drilled at it', () => {
    const progress = withDrilled(
      withDrilled(createProgress(config), 'alpha', 1, [1, 2, 4, 5, 6]),
      'beta',
      1,
      [1, 2],
    );

    expect(isLevelCovered(progress, sources, 1)).toBe(true);
  });

  it('treats an algorithm shorter than the level as already satisfied', () => {
    const mixed = sourcesOf({ tiny: ONE_LINE, alpha: SIMPLE_CODE });
    const progress = withDrilled(createProgress(config), 'alpha', 2, [1, 2, 4, 5, 6]);

    expect(isLevelCovered(progress, mixed, 2)).toBe(true);
    expect(isLevelCovered(progress, mixed, 1)).toBe(false);
  });

  it('is vacuously covered for an empty deck', () => {
    expect(isLevelCovered(createProgress(config), new Map<string, readonly PuzzleLine[]>(), 1)).toBe(
      true,
    );
  });
});

describe('coverageRatio', () => {
  it('is 0 on a fresh deck', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ alpha: SIMPLE_CODE, beta: LONG_CODE });

    expect(coverageRatio(createProgress(config), sources, config)).toBe(0);
  });

  it('is 0 when the deck is empty', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });

    expect(
      coverageRatio(createProgress(config), new Map<string, readonly PuzzleLine[]>(), config),
    ).toBe(0);
  });

  it('is 1 when every line is drilled at every configured level', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 3 });
    const sources = sourcesOf({ alpha: THREE_LINE });
    const progress: TriviaProgress = {
      ...createProgress(config),
      drilled: { alpha: { '1': [1, 2, 3], '2': [1, 2, 3], '3': [1, 2, 3] } },
    };

    expect(coverageRatio(progress, sources, config)).toBe(1);
  });

  it('skips levels an algorithm is too short to reach when sizing the curriculum', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 2 });
    const sources = sourcesOf({ tiny: ONE_LINE, alpha: THREE_LINE });
    const progress = withDrilled(createProgress(config), 'tiny', 1, [1]);

    // Levels counted: 1 -> tiny(1) + alpha(3); 2 -> alpha(3) only. One line drilled.
    expect(coverageRatio(progress, sources, config)).toBeCloseTo(1 / 7, 10);
  });

  it('rises monotonically and never exceeds 1 as rounds are recorded', () => {
    const config = configOf({ minBlanks: 1, maxBlanks: 2, mode: 'type' });
    const sources = sourcesOf({ alpha: THREE_LINE, beta: TWO_LINE_B });
    const rng = seededRng(2024);
    let progress = createProgress(config);
    let previous = coverageRatio(progress, sources, config);

    expect(previous).toBe(0);

    for (let i = 0; i < 40 && !progress.completed; i += 1) {
      const round = pickRound({ config, progress, sources, rng });
      if (!round) break;
      progress = recordRound(progress, round, gradeRound(round, correctAnswers(round)), config, sources);
      const ratio = coverageRatio(progress, sources, config);

      expect(ratio).toBeGreaterThanOrEqual(previous);
      expect(ratio).toBeLessThanOrEqual(1);
      previous = ratio;
    }

    expect(progress.completed).toBe(true);
    expect(coverageRatio(progress, sources, config)).toBe(1);
  });
});

describe('describeMode', () => {
  it('describes each answer mode', () => {
    expect(describeMode('choice')).toBe('Drag the matching line into each blank');
    expect(describeMode('type')).toBe('Type each missing line from memory');
  });
});

describe('end to end over a real four-algorithm deck', () => {
  const DECK = ['two-sum', 'bubble-sort', 'binary-search-matrix', 'bfs-graph'];

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

  it('parses every deck entry into drillable lines', () => {
    const sources = realSources();

    expect(sources.size).toBe(4);
    for (const [id, lines] of sources) {
      expect(blankableLines(lines).length).toBeGreaterThanOrEqual(4);
      expect(lines.map((line) => line.number)).toEqual(
        lines.map((_line, index) => index + 1),
      );
      lines.forEach((line) => {
        expect(line.indent + line.content).toBe(line.text);
        if (line.blankable) expect(line.content.trim().length).toBeGreaterThan(0);
        if (line.content.trim().length === 0) expect(line.blankable).toBe(false);
      });
      expect(id).toBeTruthy();
    }
  });

  it('escalates from minBlanks to maxBlanks and completes when answered correctly', () => {
    const config = configOf({
      deck: DECK,
      mode: 'choice',
      minBlanks: 1,
      maxBlanks: 3,
      includeDistractors: true,
    });
    const sources = realSources();
    const meta = realMeta();
    const rng = seededRng(0xc0ffee);
    // Worst case is one new line per round at every level, so this bound cannot be
    // reached by a converging drill; hitting it means the loop stopped progressing.
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

    // Correct answers must leave the recall weighting flat.
    for (const algorithmStats of Object.values(progress.stats)) {
      for (const stat of Object.values(algorithmStats)) {
        expect(stat.misses).toBe(0);
        expect(stat.attempts).toBeGreaterThan(0);
      }
    }
  });

  it('still completes when every answer is wrong, recording each miss', () => {
    const config = configOf({
      deck: DECK,
      mode: 'type',
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
