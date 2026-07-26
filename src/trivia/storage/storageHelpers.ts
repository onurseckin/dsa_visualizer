import type { TriviaConfig, TriviaLineStat, TriviaMode, TriviaProgress } from "../../types/trivia";
import { MAX_BLANKS_CEILING, MIN_BLANKS_FLOOR } from "../triviaEngine";

export const TRIVIA_CONFIG_KEY = "dsa_visualizer_trivia_config_v1";
export const TRIVIA_PROGRESS_KEY = "dsa_visualizer_trivia_progress_v1";

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
  const drilled: TriviaProgress["drilled"] = {};
  for (const [algorithmId, levels] of Object.entries(progress.drilled)) {
    const copy: Record<string, number[]> = {};
    for (const [level, lines] of Object.entries(levels)) copy[level] = [...lines];
    drilled[algorithmId] = copy;
  }

  const stats: TriviaProgress["stats"] = {};
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

export type RawTriviaStorageValue =
  | string
  | number
  | boolean
  | null
  | TriviaConfig
  | TriviaProgress
  | Record<string, unknown>
  | Array<unknown>;

export const isRecord = (
  value: RawTriviaStorageValue,
): value is Record<string, RawTriviaStorageValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isMode = (value: RawTriviaStorageValue): value is TriviaMode =>
  value === "choice" || value === "type";

/** A blank count that the engine can actually run at. */
export const isBlankCount = (value: RawTriviaStorageValue): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_BLANKS_FLOOR &&
  value <= MAX_BLANKS_CEILING;

export const isTally = (value: RawTriviaStorageValue): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

export const clampLevel = (value: number): number => {
  if (!Number.isFinite(value)) return MIN_BLANKS_FLOOR;
  return Math.min(MAX_BLANKS_CEILING, Math.max(MIN_BLANKS_FLOOR, Math.round(value)));
};

/** Deck ids are opaque strings here: an id no longer in the registry is the
    caller's problem to filter, not a reason to drop the whole deck. */
export const readDeck = (value: RawTriviaStorageValue): string[] | null => {
  if (!Array.isArray(value)) return null;
  const deck: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.length === 0) return null;
    if (!deck.includes(entry)) deck.push(entry);
  }
  return deck;
};

export const readLineNumbers = (value: RawTriviaStorageValue): number[] | null => {
  if (!Array.isArray(value)) return null;
  const lines: number[] = [];
  for (const entry of value) {
    if (typeof entry !== "number" || !Number.isInteger(entry) || entry < 1) return null;
    if (!lines.includes(entry)) lines.push(entry);
  }
  return lines.sort((a, b) => a - b);
};

export const getStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Reads and JSON-parses a versioned key; null for missing, unreadable, malformed or stale. */
export const readVersioned = (key: string): Record<string, RawTriviaStorageValue> | null => {
  const storage = getStorage();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: RawTriviaStorageValue;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.version !== TRIVIA_STORAGE_VERSION) return null;
  return parsed;
};

export const writeVersioned = (
  key: string,
  payload: Record<string, RawTriviaStorageValue>,
): void => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ version: TRIVIA_STORAGE_VERSION, ...payload }));
  } catch {
    // Storage full or blocked: the in-memory value still applies this session.
  }
};
