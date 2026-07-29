import type {
  PuzzleLine,
  TriviaConfig,
  TriviaLineReview,
  TriviaProgress,
  TriviaRound,
  TriviaSessionRecord,
} from "../types/trivia";
import { DEFAULT_TRIVIA_CONFIG, createProgress } from "./triviaEngine";
import { cloneTriviaConfig, cloneTriviaProgress } from "./triviaCloning";

export const TRIVIA_SESSIONS_KEY = "dsa_visualizer_trivia_sessions_v1";
export const TRIVIA_ACTIVE_SESSION_KEY = "dsa_visualizer_active_trivia_session_v1";

const getStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

export function generateNextSessionName(sessions: readonly TriviaSessionRecord[]): string {
  let maxIndex = 0;
  const pattern = /^(?:Session|Trivia)\s+(\d+)$/i;
  for (const s of sessions) {
    const match = s.name.trim().match(pattern);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) maxIndex = idx;
    }
  }
  return `Session ${maxIndex + 1}`;
}

export function readTriviaSessions(): TriviaSessionRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(TRIVIA_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTriviaSessionRecord);
  } catch {
    return [];
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value: unknown): value is number =>
  isNonNegativeInteger(value) && value > 0;

const isTriviaConfig = (value: unknown): value is TriviaConfig =>
  isRecord(value) &&
  Array.isArray(value.deck) &&
  value.deck.every((id) => typeof id === "string" && id.length > 0) &&
  new Set(value.deck).size === value.deck.length &&
  (value.mode === "choice" || value.mode === "type") &&
  isPositiveInteger(value.minBlanks) &&
  isPositiveInteger(value.maxBlanks) &&
  value.minBlanks <= value.maxBlanks &&
  value.maxBlanks <= 100 &&
  typeof value.includeDistractors === "boolean";

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(isPositiveInteger);

const isDrilled = (value: unknown): boolean =>
  isRecord(value) &&
  Object.values(value).every(
    (levels) =>
      isRecord(levels) &&
      Object.entries(levels).every(
        ([level, lines]) => isPositiveInteger(Number(level)) && isNumberArray(lines),
      ),
  );

const isStats = (value: unknown): boolean =>
  isRecord(value) &&
  Object.values(value).every(
    (lines) =>
      isRecord(lines) &&
      Object.entries(lines).every(
        ([line, stat]) =>
          isPositiveInteger(Number(line)) &&
          isRecord(stat) &&
          isNonNegativeInteger(stat.attempts) &&
          isNonNegativeInteger(stat.misses) &&
          stat.misses <= stat.attempts,
      ),
  );

const isReview = (value: unknown): value is TriviaLineReview =>
  isRecord(value) &&
  (value.intervalIndex === 0 || value.intervalIndex === 1 || value.intervalIndex === 2) &&
  (value.dueAt === undefined || isNonNegativeInteger(value.dueAt)) &&
  isNonNegativeInteger(value.lastReviewedAt) &&
  typeof value.variant === "string" &&
  value.variant.length > 0 &&
  [1, 2, 3, 4, 5].includes(value.confidence as number) &&
  typeof value.correct === "boolean" &&
  typeof value.masteryScore === "number" &&
  Number.isFinite(value.masteryScore) &&
  value.masteryScore >= 0 &&
  value.masteryScore <= 1 &&
  typeof value.mastered === "boolean" &&
  Array.isArray(value.misconceptionCodes) &&
  value.misconceptionCodes.every(
    (code) => typeof code === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code),
  ) &&
  typeof value.response === "string" &&
  value.response.length <= 8_192;

const isReviews = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    Object.values(value).every(
      (lines) =>
        isRecord(lines) &&
        Object.entries(lines).every(
          ([line, review]) => isPositiveInteger(Number(line)) && isReview(review),
        ),
    ));

const isTriviaProgress = (value: unknown): value is TriviaProgress =>
  isRecord(value) &&
  isPositiveInteger(value.level) &&
  isDrilled(value.drilled) &&
  isStats(value.stats) &&
  isReviews(value.reviews) &&
  typeof value.completed === "boolean" &&
  isNonNegativeInteger(value.roundsPlayed);

const isPuzzleLine = (value: unknown): value is PuzzleLine =>
  isRecord(value) &&
  isPositiveInteger(value.number) &&
  typeof value.text === "string" &&
  typeof value.indent === "string" &&
  typeof value.content === "string" &&
  typeof value.blankable === "boolean";

const isTriviaRound = (value: unknown): value is TriviaRound => {
  if (
    !isRecord(value) ||
    typeof value.algorithmId !== "string" ||
    value.algorithmId.length === 0 ||
    !isPositiveInteger(value.level) ||
    !Array.isArray(value.lines) ||
    !value.lines.every(isPuzzleLine) ||
    !isNumberArray(value.blanks)
  ) {
    return false;
  }
  const sourceByLine = new Map(value.lines.map((line) => [line.number, line]));
  const blankSet = new Set(value.blanks);
  if (
    blankSet.size !== value.blanks.length ||
    !value.blanks.every((line) => sourceByLine.get(line)?.blankable === true) ||
    !Array.isArray(value.tiles) ||
    new Set(value.tiles.map((tile) => (isRecord(tile) ? tile.id : ""))).size !==
      value.tiles.length ||
    !value.tiles.every(
      (tile) =>
        isRecord(tile) &&
        typeof tile.id === "string" &&
        tile.id.length > 0 &&
        typeof tile.text === "string" &&
        (tile.correctFor === null ||
          (isPositiveInteger(tile.correctFor) && blankSet.has(tile.correctFor))),
    ) ||
    (value.variant !== undefined &&
      (typeof value.variant !== "string" || value.variant.length === 0)) ||
    (value.retrievalPrompt !== undefined &&
      (!isRecord(value.retrievalPrompt) ||
        (value.retrievalPrompt.kind !== "invariant" &&
          value.retrievalPrompt.kind !== "prediction") ||
        typeof value.retrievalPrompt.prompt !== "string" ||
        value.retrievalPrompt.prompt.trim().length === 0))
  ) {
    return false;
  }
  const validLineRecord = (record: unknown, valueValidator: (entry: unknown) => boolean): boolean =>
    isRecord(record) &&
    Object.entries(record).every(
      ([line, entry]) =>
        isPositiveInteger(Number(line)) && blankSet.has(Number(line)) && valueValidator(entry),
    );
  return (
    (value.acceptedAnswers === undefined ||
      validLineRecord(
        value.acceptedAnswers,
        (answers) =>
          Array.isArray(answers) &&
          answers.length > 0 &&
          answers.every((answer) => typeof answer === "string" && answer.length > 0),
      )) &&
    (value.misconceptionCodes === undefined ||
      validLineRecord(
        value.misconceptionCodes,
        (code) => typeof code === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code),
      ))
  );
};

function isTriviaSessionRecord(value: unknown): value is TriviaSessionRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    isNonNegativeInteger(value.createdAt) &&
    isNonNegativeInteger(value.updatedAt) &&
    isTriviaConfig(value.config) &&
    isTriviaProgress(value.progress) &&
    value.progress.level >= value.config.minBlanks &&
    value.progress.level <= value.config.maxBlanks &&
    (value.lastScreen === "setup" || value.lastScreen === "drill") &&
    (value.activeRound === undefined ||
      value.activeRound === null ||
      isTriviaRound(value.activeRound))
  );
}

import { syncKeyToSqlite } from "../app/sqliteSync";

export function writeTriviaSessions(sessions: TriviaSessionRecord[]): void {
  const storage = getStorage();
  const value = JSON.stringify(sessions);
  if (storage) {
    try {
      storage.setItem(TRIVIA_SESSIONS_KEY, value);
    } catch {
      // Best effort write
    }
  }
  void syncKeyToSqlite(TRIVIA_SESSIONS_KEY, value);
}

export function readActiveSessionId(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(TRIVIA_ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeActiveSessionId(id: string | null): void {
  const storage = getStorage();
  if (storage) {
    try {
      if (id === null) {
        storage.removeItem(TRIVIA_ACTIVE_SESSION_KEY);
      } else {
        storage.setItem(TRIVIA_ACTIVE_SESSION_KEY, id);
      }
    } catch {
      // Best effort write
    }
  }
  void syncKeyToSqlite(TRIVIA_ACTIVE_SESSION_KEY, id);
}

export function createSession(
  name?: string,
  config?: TriviaConfig,
  progress?: TriviaProgress,
): TriviaSessionRecord {
  const existing = readTriviaSessions();
  const sessionName =
    name && name.trim().length > 0 ? name.trim() : generateNextSessionName(existing);
  const now = Date.now();
  const sessionConfig = cloneTriviaConfig(config ?? DEFAULT_TRIVIA_CONFIG);
  const sessionProgress = cloneTriviaProgress(progress ?? createProgress(sessionConfig));
  const newSession: TriviaSessionRecord = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: sessionName,
    createdAt: now,
    updatedAt: now,
    config: sessionConfig,
    progress: sessionProgress,
    // Every new session always lands on Setup first (TASKS.md 9.1) — there is
    // no "drill" a session could start on before it has ever been configured.
    lastScreen: "setup",
  };
  const updated = [newSession, ...existing];
  writeTriviaSessions(updated);
  writeActiveSessionId(newSession.id);
  return newSession;
}

export function updateSession(
  id: string,
  patch: Partial<Omit<TriviaSessionRecord, "id">>,
): TriviaSessionRecord | null {
  const existing = readTriviaSessions();
  const index = existing.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const current = existing[index];
  const updatedRecord: TriviaSessionRecord = {
    ...current,
    ...patch,
    config: patch.config ? cloneTriviaConfig(patch.config) : current.config,
    progress: patch.progress ? cloneTriviaProgress(patch.progress) : current.progress,
    updatedAt: Date.now(),
  };
  existing[index] = updatedRecord;
  writeTriviaSessions(existing);
  return updatedRecord;
}

export function deleteSession(id: string): void {
  const existing = readTriviaSessions();
  const filtered = existing.filter((s) => s.id !== id);
  writeTriviaSessions(filtered);
  if (readActiveSessionId() === id) {
    writeActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
  }
}

export interface TriviaBootstrap {
  sessions: TriviaSessionRecord[];
  /** null means Home — the page's own third screen, not "editing session N"
      (TASKS.md 9.1). Zero sessions is only reachable again later (delete the
      last one) — the true first-ever visit fast-tracks past it, see below. */
  activeId: string | null;
}

/** Restores a valid active session, or creates one clean default on first use.
 * Unknown and stale session storage is discarded rather than migrated. An explicit
 * null active pointer remains Home; a stale non-null pointer also falls back
 * to Home instead of silently selecting a different session. */
export function loadTriviaBootstrap(): TriviaBootstrap {
  const existing = readTriviaSessions();

  if (existing.length > 0) {
    const activeId = readActiveSessionId();
    const active = activeId !== null ? existing.find((s) => s.id === activeId) : undefined;
    return { sessions: existing, activeId: active ? active.id : null };
  }

  const created = createSession();
  return { sessions: [created], activeId: created.id };
}
