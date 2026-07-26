import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSession,
  deleteSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../triviaSessions';
import { DEFAULT_TRIVIA_CONFIG, createProgress } from '../triviaEngine';

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

  it('updates session progress and status correctly', () => {
    const session = createSession('Dynamic Programming');
    const updatedProgress = createProgress(DEFAULT_TRIVIA_CONFIG);
    updatedProgress.roundsPlayed = 5;

    const updated = updateSession(session.id, {
      progress: updatedProgress,
      status: 'paused',
    });

    expect(updated).not.toBeNull();
    expect(updated?.progress.roundsPlayed).toBe(5);
    expect(updated?.status).toBe('paused');

    const reloaded = readTriviaSessions().find((s) => s.id === session.id);
    expect(reloaded?.progress.roundsPlayed).toBe(5);
    expect(reloaded?.status).toBe('paused');
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
});
