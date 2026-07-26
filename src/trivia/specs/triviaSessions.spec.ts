import { beforeEach, describe, expect, it } from 'vitest';
import {
  TRIVIA_SESSIONS_KEY,
  createSession,
  deleteSession,
  loadTriviaBootstrap,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../triviaSessions';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../triviaEngine';
import { writeTriviaConfig, writeTriviaProgress } from '../triviaStorage';

describe('triviaSessions storage & lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates incremental session names when no name is provided', () => {
    const s1 = createSession();
    expect(s1.name).toBe('Session 1');

    const s2 = createSession();
    expect(s2.name).toBe('Session 2');

    const custom = createSession('Graph Practice');
    expect(custom.name).toBe('Graph Practice');

    const s3 = createSession();
    expect(s3.name).toBe('Session 3');
  });

  it('persists sessions to localStorage and retrieves them', () => {
    expect(readTriviaSessions()).toEqual([]);

    const session = createSession('Test Drill');
    const loaded = readTriviaSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(session.id);
    expect(loaded[0].name).toBe('Test Drill');
    expect(readActiveSessionId()).toBe(session.id);
  });

  it('updates session progress and lastScreen correctly', () => {
    const session = createSession('Dynamic Programming');
    expect(session.lastScreen).toBe('setup');
    const updatedProgress = createProgress(DEFAULT_TRIVIA_CONFIG);
    updatedProgress.roundsPlayed = 5;

    const updated = updateSession(session.id, {
      progress: updatedProgress,
      lastScreen: 'drill',
    });

    expect(updated).not.toBeNull();
    expect(updated?.progress.roundsPlayed).toBe(5);
    expect(updated?.lastScreen).toBe('drill');

    const reloaded = readTriviaSessions().find((s) => s.id === session.id);
    expect(reloaded?.progress.roundsPlayed).toBe(5);
    expect(reloaded?.lastScreen).toBe('drill');
  });

  it('deletes a session and clears active ID if deleted', () => {
    const s1 = createSession('Session 1');
    const s2 = createSession('Session 2');

    writeActiveSessionId(s2.id);
    expect(readActiveSessionId()).toBe(s2.id);

    deleteSession(s2.id);
    expect(readTriviaSessions()).toHaveLength(1);
    expect(readActiveSessionId()).toBe(s1.id);
  });

  describe('loadTriviaBootstrap (TASKS.md 9.1 — zero sessions is legitimate)', () => {
    it('auto-creates and enters a single session on a genuine first visit, landing on Setup', () => {
      const boot = loadTriviaBootstrap();
      expect(boot.sessions).toHaveLength(1);
      expect(boot.activeId).toBe(boot.sessions[0].id);
      // Newly-created sessions always default to Setup (createSession's own
      // invariant) — this is what "faster navigation" actually lands on.
      expect(boot.sessions[0].lastScreen).toBe('setup');
    });

    it('does not manufacture a second session just because the page rendered again', () => {
      const first = loadTriviaBootstrap();
      const second = loadTriviaBootstrap();
      expect(readTriviaSessions()).toHaveLength(1);
      expect(second.activeId).toBe(first.activeId);
    });

    it('migrates real legacy bare-key progress into one session, but still lands on Home', () => {
      writeTriviaConfig({ deck: ['bubble-sort'] });

      const boot = loadTriviaBootstrap();
      expect(boot.sessions).toHaveLength(1);
      expect(boot.sessions[0].config.deck).toEqual(['bubble-sort']);
      // Migrated, but not auto-entered — the user still picks it from Home.
      expect(boot.activeId).toBeNull();
    });

    it('treats untouched legacy defaults (empty deck, zero progress) the same as a true first visit', () => {
      writeTriviaConfig({ deck: [] });
      writeTriviaProgress(createProgress(DEFAULT_TRIVIA_CONFIG));

      const boot = loadTriviaBootstrap();
      // Nothing worth migrating, so this is indistinguishable from a fresh
      // install — a single session is created and entered, same as above.
      expect(boot.sessions).toHaveLength(1);
      expect(boot.activeId).toBe(boot.sessions[0].id);
    });

    it('trusts an explicit null active-id pointer (Back to Trivia Home) across a reload', () => {
      const session = createSession('Session 1');
      writeActiveSessionId(null);

      const boot = loadTriviaBootstrap();
      expect(boot.sessions.map((s) => s.id)).toEqual([session.id]);
      expect(boot.activeId).toBeNull();
    });

    it('resumes whichever session the active-id pointer names', () => {
      const session = createSession('Session 1');
      writeActiveSessionId(session.id);

      const boot = loadTriviaBootstrap();
      expect(boot.activeId).toBe(session.id);
    });

    it('falls back to Home, not a silently substituted session, when the pointer is stale', () => {
      createSession('Session 1');
      writeActiveSessionId('does-not-exist');

      const boot = loadTriviaBootstrap();
      expect(boot.activeId).toBeNull();
    });

    it('rejects a legacy-shaped session record missing lastScreen instead of crashing', () => {
      createSession('Session 1');
      const raw = JSON.parse(
        window.localStorage.getItem(TRIVIA_SESSIONS_KEY) ?? '[]',
      ) as Record<string, unknown>[];
      delete raw[0].lastScreen;
      window.localStorage.setItem(TRIVIA_SESSIONS_KEY, JSON.stringify(raw));

      expect(readTriviaSessions()).toEqual([]);
    });
  });
});
