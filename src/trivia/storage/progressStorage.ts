import type { TriviaLineStat, TriviaProgress } from "../../types/trivia";
import { createProgress } from "../triviaEngine";
import { readTriviaConfig } from "./configStorage";
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_PROGRESS_KEY,
  RawTriviaStorageValue,
  clampLevel,
  cloneTriviaProgress,
  getStorage,
  isBlankCount,
  isRecord,
  isTally,
  readLineNumbers,
  readVersioned,
  writeVersioned,
} from "./storageHelpers";

export const readDrilled = (value: RawTriviaStorageValue): TriviaProgress["drilled"] | null => {
  if (!isRecord(value)) return null;
  const drilled: TriviaProgress["drilled"] = {};
  for (const [algorithmId, levels] of Object.entries(value)) {
    if (!isRecord(levels)) return null;
    const byLevel: Record<string, number[]> = {};
    for (const [level, lines] of Object.entries(levels)) {
      if (!isBlankCount(Number(level))) return null;
      const parsedLines = readLineNumbers(lines);
      if (parsedLines === null) return null;
      byLevel[level] = parsedLines;
    }
    drilled[algorithmId] = byLevel;
  }
  return drilled;
};

export const readStats = (value: RawTriviaStorageValue): TriviaProgress["stats"] | null => {
  if (!isRecord(value)) return null;
  const stats: TriviaProgress["stats"] = {};
  for (const [algorithmId, lines] of Object.entries(value)) {
    if (!isRecord(lines)) return null;
    const byLine: Record<string, TriviaLineStat> = {};
    for (const [line, stat] of Object.entries(lines)) {
      if (!Number.isInteger(Number(line))) return null;
      if (!isRecord(stat)) return null;
      if (!isTally(stat.attempts) || !isTally(stat.misses)) return null;
      // Misses can never exceed attempts; such a record would skew the weights.
      if (stat.misses > stat.attempts) return null;
      byLine[line] = { attempts: stat.attempts as number, misses: stat.misses as number };
    }
    stats[algorithmId] = byLine;
  }
  return stats;
};

/**
 * Never throws. The fallback is a fresh progress record for the *stored* config,
 * so a restored drill starts at the configured floor rather than at level 1.
 */
export function readTriviaProgress(): TriviaProgress {
  const parsed = readVersioned(TRIVIA_PROGRESS_KEY);
  if (parsed === null) return createProgress(readTriviaConfig());

  if (!isBlankCount(parsed.level)) return createProgress(readTriviaConfig());
  if (typeof parsed.completed !== "boolean") return createProgress(readTriviaConfig());
  if (!isTally(parsed.roundsPlayed)) return createProgress(readTriviaConfig());

  const drilled = readDrilled(parsed.drilled);
  if (drilled === null) return createProgress(readTriviaConfig());
  const stats = readStats(parsed.stats);
  if (stats === null) return createProgress(readTriviaConfig());

  return {
    level: parsed.level,
    drilled,
    stats,
    completed: parsed.completed,
    roundsPlayed: parsed.roundsPlayed,
  };
}

/**
 * Progress is produced wholesale by `recordRound`, so this replaces rather than
 * patches. The level is clamped to the engine's supported range before it is
 * stored, so a bad in-memory value can never be persisted as one.
 */
export function writeTriviaProgress(progress: TriviaProgress): TriviaProgress {
  const level = clampLevel(progress.level);
  const roundsPlayed = isTally(progress.roundsPlayed) ? progress.roundsPlayed : 0;

  const stored = cloneTriviaProgress({ ...progress, level, roundsPlayed });
  writeVersioned(TRIVIA_PROGRESS_KEY, {
    level: stored.level,
    drilled: stored.drilled,
    stats: stored.stats,
    completed: stored.completed,
    roundsPlayed: stored.roundsPlayed,
  });
  return stored;
}

/** Only ever called from a confirmed "reset trivia" action; drops both keys. */
export function clearTrivia(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(TRIVIA_CONFIG_KEY);
    storage.removeItem(TRIVIA_PROGRESS_KEY);
  } catch {
    // Nothing to recover from — the caller restores defaults in memory anyway.
  }
}
