import type { PuzzleLine, TriviaConfig, TriviaProgress } from "../../types/trivia";
import { normalizeConfig } from "./triviaEngineConfig";
import { blankableLines } from "./triviaEngineParser";

export const createProgress = (config: TriviaConfig): TriviaProgress => ({
  level: normalizeConfig(config).minBlanks,
  drilled: {},
  stats: {},
  completed: false,
  roundsPlayed: 0,
});

export const levelKey = (level: number): string => String(level);

export const drilledAt = (progress: TriviaProgress, algorithmId: string, level: number): number[] =>
  progress.drilled[algorithmId]?.[levelKey(level)] ?? [];

export const statFor = (progress: TriviaProgress, algorithmId: string, line: number) =>
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
    if (all.length === 0) continue;
    if (remainingAt(progress, algorithmId, lines, level).length > 0) return false;
  }
  return true;
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
      if (all.length === 0) continue;
      const targetCount = Math.min(level, all.length);
      total += targetCount;
      const drilledCount = drilledAt(progress, algorithmId, level).length;
      done += Math.min(drilledCount, targetCount);
    }
  }
  return total === 0 ? 0 : Math.min(1, done / total);
};
