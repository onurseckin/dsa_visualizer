import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../types/trivia";
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
    return parsed.filter(
      (item): item is TriviaSessionRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.createdAt === "number" &&
        typeof item.updatedAt === "number" &&
        typeof item.config === "object" &&
        typeof item.progress === "object" &&
        (item.lastScreen === "setup" || item.lastScreen === "drill"),
    );
  } catch {
    return [];
  }
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
