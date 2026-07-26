import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from '../types/trivia';
import {
  clearTrivia,
  cloneTriviaConfig,
  cloneTriviaProgress,
  readTriviaConfig,
  readTriviaProgress,
} from './triviaStorage';

export const TRIVIA_SESSIONS_KEY = 'dsa_visualizer_trivia_sessions_v1';
export const TRIVIA_ACTIVE_SESSION_KEY = 'dsa_visualizer_active_trivia_session_v1';

const getStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
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
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.createdAt === 'number' &&
        typeof item.updatedAt === 'number' &&
        typeof item.config === 'object' &&
        typeof item.progress === 'object'
    );
  } catch {
    return [];
  }
}

export function writeTriviaSessions(sessions: TriviaSessionRecord[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(TRIVIA_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Best effort write
  }
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
  if (!storage) return;
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

export function createSession(
  name?: string,
  config?: TriviaConfig,
  progress?: TriviaProgress
): TriviaSessionRecord {
  const existing = readTriviaSessions();
  const sessionName = name && name.trim().length > 0 ? name.trim() : generateNextSessionName(existing);
  const now = Date.now();
  const newSession: TriviaSessionRecord = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: sessionName,
    createdAt: now,
    updatedAt: now,
    config: cloneTriviaConfig(config ?? readTriviaConfig()),
    progress: cloneTriviaProgress(progress ?? readTriviaProgress()),
    status: 'active',
  };
  const updated = [newSession, ...existing];
  writeTriviaSessions(updated);
  writeActiveSessionId(newSession.id);
  return newSession;
}

export function updateSession(
  id: string,
  patch: Partial<Omit<TriviaSessionRecord, 'id'>>
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

export interface ActiveSessionBootstrap {
  sessions: TriviaSessionRecord[];
  active: TriviaSessionRecord;
}

/**
 * Guarantees a session exists and is active, so the trivia page never has a
 * "nothing selected" state to render around. Three cases, in order:
 *
 * 1. Sessions already exist and the stored active id points at one of them —
 *    used as-is.
 * 2. Sessions exist but the active-id pointer is missing or stale (cleared
 *    storage, a deleted session) — the most recent session becomes active.
 * 3. No sessions exist at all. This is either a first visit, or a pre-sessions
 *    install that only has the bare `triviaConfig`/`triviaProgress` keys. The
 *    one session created here is seeded FROM those bare keys (which safely
 *    read as engine defaults when absent), so a returning user's deck and
 *    drilled coverage carries over instead of silently resetting — then the
 *    bare keys are retired since the session record is now their only owner.
 */
export function ensureActiveSession(): ActiveSessionBootstrap {
  const existing = readTriviaSessions();

  if (existing.length > 0) {
    const activeId = readActiveSessionId();
    const active = activeId !== null ? existing.find((s) => s.id === activeId) : undefined;
    if (active) return { sessions: existing, active };

    writeActiveSessionId(existing[0].id);
    return { sessions: existing, active: existing[0] };
  }

  const seeded = createSession(undefined, readTriviaConfig(), readTriviaProgress());
  clearTrivia();
  return { sessions: [seeded], active: seeded };
}
