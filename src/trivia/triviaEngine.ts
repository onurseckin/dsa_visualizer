import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaMeta,
  TriviaMode,
  TriviaProgress,
  TriviaRound,
  TriviaTile,
} from '../types/trivia';

/* Pure drill logic — no React, no storage, no Math.random by default, so every
   escalation rule below is directly testable. See src/types/trivia.ts for why the
   progression is coverage-driven rather than time-driven. */

export type Rng = () => number;

export const DEFAULT_TRIVIA_CONFIG: TriviaConfig = {
  deck: [],
  mode: 'choice',
  minBlanks: 1,
  maxBlanks: 3,
  // Off by default — a learner who wants the extra recognition challenge opts
  // into distractor tiles rather than being opted in automatically.
  includeDistractors: false,
};

/* The floor stays at 1, never 0: a 0-blank round would ask pickRound for zero
   hidden lines, leaving buildTiles/grading nothing to check — not a drill at
   all — and eligible/blankableLines below assume at least one blank per round. */
export const MIN_BLANKS_FLOOR = 1;
export const MAX_BLANKS_CEILING = 100;

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

/** Keeps min <= max and both inside the supported range. */
export const normalizeConfig = (config: TriviaConfig): TriviaConfig => {
  const minBlanks = clampInt(config.minBlanks, MIN_BLANKS_FLOOR, MAX_BLANKS_CEILING);
  const maxBlanks = clampInt(config.maxBlanks, minBlanks, MAX_BLANKS_CEILING);
  return { ...config, minBlanks, maxBlanks };
};

/**
 * Splits a solution into drillable lines.
 *
 * Indentation is separated from content on purpose: Python's meaning depends on
 * it, but making the learner retype leading spaces tests typing, not recall, so
 * the UI shows the indent and grades only the content.
 */
export const parsePuzzleLines = (code: string, meta?: TriviaMeta): PuzzleLine[] => {
  const skip = new Set(meta?.skipLines ?? []);
  return code.replace(/\s+$/, '').split('\n').map((raw, index) => {
    const number = index + 1;
    const match = /^(\s*)(.*)$/.exec(raw);
    const indent = match ? match[1] : '';
    const content = match ? match[2] : raw;
    return {
      number,
      text: raw,
      indent,
      content,
      blankable: content.trim().length > 0 && !skip.has(number),
    };
  });
};

export const blankableLines = (lines: readonly PuzzleLine[]): number[] =>
  lines.filter((line) => line.blankable).map((line) => line.number);

export const createProgress = (config: TriviaConfig): TriviaProgress => ({
  level: normalizeConfig(config).minBlanks,
  drilled: {},
  stats: {},
  completed: false,
  roundsPlayed: 0,
});

const levelKey = (level: number): string => String(level);

const drilledAt = (progress: TriviaProgress, algorithmId: string, level: number): number[] =>
  progress.drilled[algorithmId]?.[levelKey(level)] ?? [];

const statFor = (progress: TriviaProgress, algorithmId: string, line: number) =>
  progress.stats[algorithmId]?.[String(line)] ?? { attempts: 0, misses: 0 };

/** Lines of one algorithm still awaiting their first drill at `level`. */
export const remainingAt = (
  progress: TriviaProgress,
  algorithmId: string,
  lines: readonly PuzzleLine[],
  level: number,
): number[] => {
  const done = new Set(drilledAt(progress, algorithmId, level));
  return blankableLines(lines).filter((n) => !done.has(n));
};

/**
 * A level is complete only when every deck entry has met every one of its
 * blankable lines at that level. An algorithm too short to supply `level`
 * distinct lines can never be hidden that far, so it is treated as satisfied
 * rather than blocking the whole deck forever.
 */
export const isLevelCovered = (
  progress: TriviaProgress,
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
  level: number,
): boolean => {
  for (const [algorithmId, lines] of sources) {
    const all = blankableLines(lines);
    if (all.length < level) continue;
    if (remainingAt(progress, algorithmId, lines, level).length > 0) return false;
  }
  return true;
};

const shuffle = <T,>(items: readonly T[], rng: Rng): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = out[j];
    out[j] = out[i];
    out[i] = swap;
  }
  return out;
};

/**
 * Weighted pick without replacement. Weight is `misses + 1`, so a line you have
 * fumbled resurfaces sooner while never starving the lines you know.
 */
const pickWeighted = (
  candidates: readonly number[],
  count: number,
  weightOf: (line: number) => number,
  rng: Rng,
): number[] => {
  const pool = [...candidates];
  const chosen: number[] = [];
  while (chosen.length < count && pool.length > 0) {
    const weights = pool.map((line) => Math.max(weightOf(line), 0.0001));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let ticket = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      ticket -= weights[i];
      if (ticket <= 0) {
        index = i;
        break;
      }
    }
    chosen.push(pool[index]);
    pool.splice(index, 1);
  }
  return chosen;
};

export interface PickRoundOptions {
  config: TriviaConfig;
  progress: TriviaProgress;
  /** algorithmId -> parsed lines, for every id in the deck. */
  sources: ReadonlyMap<string, readonly PuzzleLine[]>;
  /** algorithmId -> author metadata, for distractor tiles. */
  meta?: ReadonlyMap<string, TriviaMeta | undefined>;
  rng?: Rng;
}

/**
 * Builds the next round: chooses an algorithm that still has uncovered lines,
 * hides `level` of them (preferring undrilled, then most-missed), and — in choice
 * mode — assembles the tile tray.
 *
 * Returns null when the deck is empty or the configured ceiling is covered.
 */
export const pickRound = ({
  config,
  progress,
  sources,
  meta,
  rng = Math.random,
}: PickRoundOptions): TriviaRound | null => {
  const normalized = normalizeConfig(config);
  if (sources.size === 0 || progress.completed) return null;

  const level = clampInt(progress.level, normalized.minBlanks, normalized.maxBlanks);

  /* Algorithms that can actually supply this many lines. Preferring the ones with
     uncovered lines is what makes a multi-question deck converge instead of
     re-drilling one lucky solution. */
  const eligible = [...sources.entries()].filter(([, lines]) => blankableLines(lines).length >= level);
  if (eligible.length === 0) return null;

  const uncovered = eligible.filter(
    ([id, lines]) => remainingAt(progress, id, lines, level).length > 0,
  );
  const pool = uncovered.length > 0 ? uncovered : eligible;
  const [algorithmId, lines] = pool[Math.floor(rng() * pool.length) % pool.length];

  const remaining = remainingAt(progress, algorithmId, lines, level);
  const all = blankableLines(lines);
  const weightOf = (line: number) => statFor(progress, algorithmId, line).misses + 1;

  // Fill from undrilled lines first, then top up from the rest of the solution.
  const primary = pickWeighted(remaining, level, weightOf, rng);
  const filler =
    primary.length < level
      ? pickWeighted(
          all.filter((n) => !primary.includes(n)),
          level - primary.length,
          weightOf,
          rng,
        )
      : [];
  const blanks = [...primary, ...filler].sort((a, b) => a - b);

  return {
    algorithmId,
    level,
    lines: [...lines],
    blanks,
    tiles: normalized.mode === 'choice'
      ? buildTiles(lines, blanks, normalized.includeDistractors ? meta?.get(algorithmId) : undefined, rng)
      : [],
  };
};

/**
 * Tiles for choice mode: one per blank, plus decoys.
 *
 * The decoys are other real lines from the same solution — the user's own idea,
 * and a good one, because a plausible line from the same function is far harder
 * to reject than random text. Author-supplied distractors are added on top.
 */
export const buildTiles = (
  lines: readonly PuzzleLine[],
  blanks: readonly number[],
  meta: TriviaMeta | undefined,
  rng: Rng,
): TriviaTile[] => {
  const blankSet = new Set(blanks);
  const answers: TriviaTile[] = blanks.map((number) => {
    const line = lines.find((candidate) => candidate.number === number);
    return { id: `answer-${number}`, text: line?.content ?? '', correctFor: number };
  });

  // One decoy per blank keeps the tray proportional to the difficulty.
  const decoyPool = lines
    .filter((line) => line.blankable && !blankSet.has(line.number))
    .map((line) => line.content);
  const authored = meta?.distractors ?? [];
  /* Decoys must differ from the ANSWERS too, not just from each other: 13 of the
     40 solutions repeat a line verbatim (`return False`, `node = node.children[c]`),
     and grading compares text, so a spare line identical to a blanked one would be
     a tile that is simultaneously labelled a decoy and accepted as correct. */
  const answerTexts = new Set(answers.map((tile) => tile.text));
  const decoys = shuffle([...decoyPool, ...authored], rng)
    .filter((text, index, list) => list.indexOf(text) === index && !answerTexts.has(text))
    .slice(0, blanks.length)
    .map((text, index) => ({ id: `decoy-${index}`, text, correctFor: null }));

  return shuffle([...answers, ...decoys], rng);
};

/**
 * Collapses each run of internal whitespace down to a single space, after
 * trimming the ends. A *run* can only ever be collapsed, never invented or
 * deleted outright, so this tolerates cosmetic spacing choices (extra space
 * around an operator, extra space between items in a bracket/tuple literal)
 * without starting to treat "no separator" and "one separator" as the same
 * thing — a submission that omits whitespace the solution has (or adds
 * whitespace where the solution has none) still fails, which keeps this from
 * ever accepting structurally different code as correct.
 */
const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, ' ');

/**
 * Whitespace-tolerant equality: leading/trailing space never matters, and any
 * run of internal whitespace grades the same regardless of its length (so
 * `total  =  0` and `total = 0` are equivalent). Everything else — the actual
 * characters, casing, and whether a given spot has whitespace at all — must
 * still match exactly.
 */
export const isAnswerCorrect = (submitted: string, expected: string): boolean =>
  normalizeWhitespace(submitted) === normalizeWhitespace(expected);

export const gradeRound = (
  round: TriviaRound,
  answers: Readonly<Record<number, string>>,
): TriviaGrade => {
  const perBlank: Record<number, boolean> = {};
  round.blanks.forEach((number) => {
    const line = round.lines.find((candidate) => candidate.number === number);
    perBlank[number] = isAnswerCorrect(answers[number] ?? '', line?.content ?? '');
  });
  return { perBlank, allCorrect: round.blanks.every((number) => perBlank[number]) };
};

/**
 * Folds a graded round into progress: marks its lines drilled at this level,
 * updates per-line accuracy, and escalates the level once the whole deck has
 * been covered. A revealed line still counts as drilled but is recorded as a
 * miss, so it comes back sooner rather than being quietly skipped.
 */
export const recordRound = (
  progress: TriviaProgress,
  round: TriviaRound,
  grade: TriviaGrade,
  config: TriviaConfig,
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
): TriviaProgress => {
  const normalized = normalizeConfig(config);
  const levelSlot = levelKey(round.level);
  const previous = drilledAt(progress, round.algorithmId, round.level);
  const merged = [...new Set([...previous, ...round.blanks])].sort((a, b) => a - b);

  const algorithmStats = { ...(progress.stats[round.algorithmId] ?? {}) };
  round.blanks.forEach((number) => {
    const key = String(number);
    const current = algorithmStats[key] ?? { attempts: 0, misses: 0 };
    algorithmStats[key] = {
      attempts: current.attempts + 1,
      misses: current.misses + (grade.perBlank[number] ? 0 : 1),
    };
  });

  const next: TriviaProgress = {
    ...progress,
    roundsPlayed: progress.roundsPlayed + 1,
    drilled: {
      ...progress.drilled,
      [round.algorithmId]: {
        ...(progress.drilled[round.algorithmId] ?? {}),
        [levelSlot]: merged,
      },
    },
    stats: { ...progress.stats, [round.algorithmId]: algorithmStats },
  };

  if (!isLevelCovered(next, sources, round.level)) return next;
  if (round.level >= normalized.maxBlanks) return { ...next, completed: true };
  return { ...next, level: round.level + 1 };
};

/** Fraction of the configured curriculum drilled so far, for a progress bar. */
export const coverageRatio = (
  progress: TriviaProgress,
  sources: ReadonlyMap<string, readonly PuzzleLine[]>,
  config: TriviaConfig,
): number => {
  const { minBlanks, maxBlanks } = normalizeConfig(config);
  let total = 0;
  let done = 0;
  for (let level = minBlanks; level <= maxBlanks; level++) {
    for (const [algorithmId, lines] of sources) {
      const all = blankableLines(lines);
      if (all.length < level) continue;
      total += all.length;
      done += drilledAt(progress, algorithmId, level).length;
    }
  }
  return total === 0 ? 0 : Math.min(1, done / total);
};

export const describeMode = (mode: TriviaMode): string =>
  mode === 'choice' ? 'Drag the matching line into each blank' : 'Type each missing line from memory';
