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
        typeof item.progress === 'object' &&
        (item.lastScreen === 'setup' || item.lastScreen === 'drill')
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
    // Every new session always lands on Setup first (TASKS.md 9.1) — there is
    // no "drill" a session could start on before it has ever been configured.
    lastScreen: 'setup',
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

export interface TriviaBootstrap {
  sessions: TriviaSessionRecord[];
  /** null means Home — the page's own third screen, not "editing session N"
      (TASKS.md 9.1). Zero sessions is a legitimate, permanent state now, not
      something this bootstrap patches over by manufacturing a session. */
  activeId: string | null;
}

/**
 * Replaces the old `ensureActiveSession`'s "always guarantee an active
 * session" invariant (TASKS.md 9.1's Round-3 fix): a session is no longer
 * conjured into existence just so the page has something to render — Home's
 * empty state is the legitimate zero-session view now.
 *
 * Two cases:
 *
 * 1. Sessions already exist. Whatever the stored active-id pointer says is
 *    trusted as-is, including `null` (an explicit "Back to Trivia Home" —
 *    exactly the user's repeated complaint: exiting a session should land
 *    somewhere that isn't "editing session N", and that has to survive a
 *    reload, not just an in-memory navigate). A stale id (pointing at a
 *    session that no longer exists) falls back to Home, never to a silently
 *    substituted session — surprising the user with the wrong session open
 *    is worse than showing them the session list.
 * 2. No sessions exist. This is either a genuine first visit, or a
 *    pre-sessions install that only has the bare `triviaConfig`/
 *    `triviaProgress` keys. Those bare keys are migrated into a real session
 *    ONLY if they hold actual earned data (a non-empty deck, or real
 *    progress) — a first-time user's untouched defaults are not "data",
 *    they are nothing, and migrating them would recreate exactly the forced
 *    auto-session this fix removes. Either way the bare keys are retired:
 *    the migrated session becomes their only owner, and an empty first
 *    visit had nothing worth keeping. The migrated session (if any) is left
 *    unselected — Home shows it as a card to resume, rather than dropping
 *    the user straight into editing it.
 */
export function loadTriviaBootstrap(): TriviaBootstrap {
  const existing = readTriviaSessions();

  if (existing.length > 0) {
    const activeId = readActiveSessionId();
    const active = activeId !== null ? existing.find((s) => s.id === activeId) : undefined;
    return { sessions: existing, activeId: active ? active.id : null };
  }

  const legacyConfig = readTriviaConfig();
  const legacyProgress = readTriviaProgress();
  const hasLegacyData =
    legacyConfig.deck.length > 0 ||
    legacyProgress.roundsPlayed > 0 ||
    Object.keys(legacyProgress.drilled).length > 0;

  if (!hasLegacyData) {
    clearTrivia();
    return { sessions: [], activeId: null };
  }

  const seeded = createSession(undefined, legacyConfig, legacyProgress);
  clearTrivia();
  writeActiveSessionId(null);
  return { sessions: [seeded], activeId: null };
}
