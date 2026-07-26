/* Persisted trivia state (DESIGN.md R8.4).

   Two versioned keys, deliberately separate: the config is what the learner
   chose, the progress is what the drill earned. Changing a deck should not
   erase accumulated coverage, and a progress shape change should not reset the
   deck, so they version independently.

   The discipline is the one src/app/workspaceLayout.ts already establishes:
   storage is user-editable and can throw (Safari private mode, disabled
   storage, quota), so reads validate and fall back to defaults, writes are
   best-effort, and nothing here throws into the render path. A stored value
   with the wrong version, wrong shape, or a NaN is discarded wholesale rather
   than half-applied — a half-restored progress record would silently corrupt
   the coverage rules the escalation depends on.

   DEFAULT_TRIVIA_CONFIG and the blank-count bounds come from the engine; this
   module never redefines them. */

import type { TriviaConfig, TriviaLineStat, TriviaMode, TriviaProgress } from '../types/trivia';
import {
  DEFAULT_TRIVIA_CONFIG,
  MAX_BLANKS_CEILING,
  MIN_BLANKS_FLOOR,
  createProgress,
  normalizeConfig,
} from './triviaEngine';

export const TRIVIA_CONFIG_KEY = 'dsa_visualizer_trivia_config_v1';
export const TRIVIA_PROGRESS_KEY = 'dsa_visualizer_trivia_progress_v1';

export const TRIVIA_STORAGE_VERSION = 1;

export function cloneTriviaConfig(config: TriviaConfig): TriviaConfig {
  return {
    deck: [...config.deck],
    mode: config.mode,
    minBlanks: config.minBlanks,
    maxBlanks: config.maxBlanks,
    includeDistractors: config.includeDistractors,
  };
}

export function cloneTriviaProgress(progress: TriviaProgress): TriviaProgress {
  const drilled: TriviaProgress['drilled'] = {};
  for (const [algorithmId, levels] of Object.entries(progress.drilled)) {
    const copy: Record<string, number[]> = {};
    for (const [level, lines] of Object.entries(levels)) copy[level] = [...lines];
    drilled[algorithmId] = copy;
  }

  const stats: TriviaProgress['stats'] = {};
  for (const [algorithmId, lines] of Object.entries(progress.stats)) {
    const copy: Record<string, TriviaLineStat> = {};
    for (const [line, stat] of Object.entries(lines)) {
      copy[line] = { attempts: stat.attempts, misses: stat.misses };
    }
    stats[algorithmId] = copy;
  }

  return {
    level: progress.level,
    drilled,
    stats,
    completed: progress.completed,
    roundsPlayed: progress.roundsPlayed,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMode = (value: unknown): value is TriviaMode => value === 'choice' || value === 'type';

/** A blank count that the engine can actually run at. */
const isBlankCount = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_BLANKS_FLOOR &&
  value <= MAX_BLANKS_CEILING;

const isTally = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const clampLevel = (value: number): number => {
  if (!Number.isFinite(value)) return MIN_BLANKS_FLOOR;
  return Math.min(MAX_BLANKS_CEILING, Math.max(MIN_BLANKS_FLOOR, Math.round(value)));
};

/** Deck ids are opaque strings here: an id no longer in the registry is the
    caller's problem to filter, not a reason to drop the whole deck. */
const readDeck = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const deck: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.length === 0) return null;
    if (!deck.includes(entry)) deck.push(entry);
  }
  return deck;
};

const readLineNumbers = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) return null;
  const lines: number[] = [];
  for (const entry of value) {
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry < 1) return null;
    if (!lines.includes(entry)) lines.push(entry);
  }
  return lines.sort((a, b) => a - b);
};

const readDrilled = (value: unknown): TriviaProgress['drilled'] | null => {
  if (!isRecord(value)) return null;
  const drilled: TriviaProgress['drilled'] = {};
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

const readStats = (value: unknown): TriviaProgress['stats'] | null => {
  if (!isRecord(value)) return null;
  const stats: TriviaProgress['stats'] = {};
  for (const [algorithmId, lines] of Object.entries(value)) {
    if (!isRecord(lines)) return null;
    const byLine: Record<string, TriviaLineStat> = {};
    for (const [line, stat] of Object.entries(lines)) {
      if (!Number.isInteger(Number(line))) return null;
      if (!isRecord(stat)) return null;
      if (!isTally(stat.attempts) || !isTally(stat.misses)) return null;
      // Misses can never exceed attempts; such a record would skew the weights.
      if (stat.misses > stat.attempts) return null;
      byLine[line] = { attempts: stat.attempts, misses: stat.misses };
    }
    stats[algorithmId] = byLine;
  }
  return stats;
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Reads and JSON-parses a versioned key; null for missing, unreadable, malformed or stale. */
const readVersioned = (key: string): Record<string, unknown> | null => {
  const storage = getStorage();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.version !== TRIVIA_STORAGE_VERSION) return null;
  return parsed;
};

const writeVersioned = (key: string, payload: Record<string, unknown>): void => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ version: TRIVIA_STORAGE_VERSION, ...payload }));
  } catch {
    // Storage full or blocked: the in-memory value still applies this session.
  }
};

/** Never throws: any unreadable, stale, malformed or out-of-range value yields defaults. */
export function readTriviaConfig(): TriviaConfig {
  const parsed = readVersioned(TRIVIA_CONFIG_KEY);
  if (parsed === null) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);

  const deck = readDeck(parsed.deck);
  if (deck === null) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (!isMode(parsed.mode)) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (!isBlankCount(parsed.minBlanks) || !isBlankCount(parsed.maxBlanks)) {
    return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  }
  if (parsed.maxBlanks < parsed.minBlanks) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (typeof parsed.includeDistractors !== 'boolean') {
    return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  }

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return {
    deck,
    mode: parsed.mode,
    minBlanks: parsed.minBlanks,
    maxBlanks: parsed.maxBlanks,
    includeDistractors: parsed.includeDistractors,
  };
}

/**
 * Merges the patch onto whatever is stored, normalises it through the engine so
 * min <= max always holds, writes best-effort, and returns the stored result.
 *
 * An absent key means "leave it alone"; there is no null-means-default here
 * because every trivia setting has a concrete value.
 */
export function writeTriviaConfig(patch: Partial<TriviaConfig>): TriviaConfig {
  const current = readTriviaConfig();
  const deck = patch.deck === undefined ? current.deck : (readDeck(patch.deck) ?? current.deck);

  const merged = normalizeConfig({
    deck,
    mode: patch.mode ?? current.mode,
    minBlanks: patch.minBlanks ?? current.minBlanks,
    maxBlanks: patch.maxBlanks ?? current.maxBlanks,
    // `??` and not `||`: turning distractors off patches an explicit false.
    includeDistractors: patch.includeDistractors ?? current.includeDistractors,
  });

  const stored = cloneTriviaConfig(merged);
  writeVersioned(TRIVIA_CONFIG_KEY, {
    deck: stored.deck,
    mode: stored.mode,
    minBlanks: stored.minBlanks,
    maxBlanks: stored.maxBlanks,
    includeDistractors: stored.includeDistractors,
  });
  return stored;
}

/**
 * Never throws. The fallback is a fresh progress record for the *stored* config,
 * so a restored drill starts at the configured floor rather than at level 1.
 */
export function readTriviaProgress(): TriviaProgress {
  const parsed = readVersioned(TRIVIA_PROGRESS_KEY);
  if (parsed === null) return createProgress(readTriviaConfig());

  if (!isBlankCount(parsed.level)) return createProgress(readTriviaConfig());
  if (typeof parsed.completed !== 'boolean') return createProgress(readTriviaConfig());
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
