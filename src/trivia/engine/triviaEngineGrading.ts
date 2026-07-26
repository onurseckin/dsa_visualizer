import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaProgress,
  TriviaRound,
} from "../../types/trivia";
import { normalizeConfig } from "./triviaEngineConfig";
import { drilledAt, isLevelCovered, levelKey } from "./triviaEngineProgress";

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
const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

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
    perBlank[number] = isAnswerCorrect(answers[number] ?? "", line?.content ?? "");
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
