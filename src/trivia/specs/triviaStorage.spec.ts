import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TriviaProgress } from '../../types/trivia';
import { DEFAULT_TRIVIA_CONFIG, MAX_BLANKS_CEILING, createProgress } from '../triviaEngine';
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_PROGRESS_KEY,
  TRIVIA_STORAGE_VERSION,
  clearTrivia,
  readTriviaConfig,
  readTriviaProgress,
  writeTriviaConfig,
  writeTriviaProgress,
} from '../triviaStorage';

const storeRaw = (key: string, raw: string): void => {
  window.localStorage.setItem(key, raw);
};

const storeConfigRaw = (payload: Record<string, unknown>): void => {
  storeRaw(TRIVIA_CONFIG_KEY, JSON.stringify(payload));
};

const storeProgressRaw = (payload: Record<string, unknown>): void => {
  storeRaw(TRIVIA_PROGRESS_KEY, JSON.stringify(payload));
};

const validConfigPayload = {
  version: TRIVIA_STORAGE_VERSION,
  deck: ['two-sum'],
  mode: 'type',
  minBlanks: 2,
  maxBlanks: 4,
  includeDistractors: false,
};

const sampleProgress: TriviaProgress = {
  level: 2,
  drilled: { 'two-sum': { '2': [3, 5] }, 'bfs-graph': { '2': [1] } },
  stats: { 'two-sum': { '3': { attempts: 2, misses: 1 }, '5': { attempts: 1, misses: 0 } } },
  completed: false,
  roundsPlayed: 3,
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('trivia config persistence', () => {
  it('falls back to the engine defaults when nothing is stored', () => {
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    // A returned copy, never the frozen engine constant.
    expect(readTriviaConfig()).not.toBe(DEFAULT_TRIVIA_CONFIG);
  });

  it('round-trips a full config through storage', () => {
    const written = writeTriviaConfig({
      deck: ['two-sum', 'bfs-graph'],
      mode: 'type',
      minBlanks: 2,
      maxBlanks: 5,
      includeDistractors: false,
    });

    expect(written).toEqual({
      deck: ['two-sum', 'bfs-graph'],
      mode: 'type',
      minBlanks: 2,
      maxBlanks: 5,
      includeDistractors: false,
    });
    expect(readTriviaConfig()).toEqual(written);
  });

  it('merges a partial patch onto the stored config', () => {
    writeTriviaConfig({ deck: ['two-sum'], mode: 'type', minBlanks: 3, maxBlanks: 6 });
    writeTriviaConfig({ mode: 'choice' });

    expect(readTriviaConfig()).toEqual({
      deck: ['two-sum'],
      mode: 'choice',
      minBlanks: 3,
      maxBlanks: 6,
      includeDistractors: DEFAULT_TRIVIA_CONFIG.includeDistractors,
    });
  });

  it('persists an explicit false rather than treating it as absent', () => {
    writeTriviaConfig({ includeDistractors: false });
    expect(readTriviaConfig().includeDistractors).toBe(false);
  });

  it('normalises an inverted or out-of-range blank range through the engine', () => {
    expect(writeTriviaConfig({ minBlanks: 6, maxBlanks: 2 })).toMatchObject({
      minBlanks: 6,
      maxBlanks: 6,
    });
    expect(writeTriviaConfig({ minBlanks: 99, maxBlanks: 99 })).toMatchObject({
      minBlanks: MAX_BLANKS_CEILING,
      maxBlanks: MAX_BLANKS_CEILING,
    });
  });

  it('de-duplicates deck ids on write', () => {
    expect(writeTriviaConfig({ deck: ['two-sum', 'two-sum', 'bfs-graph'] }).deck).toEqual([
      'two-sum',
      'bfs-graph',
    ]);
  });

  it('ignores a stored config written by a different version', () => {
    storeConfigRaw({ ...validConfigPayload, version: TRIVIA_STORAGE_VERSION + 1 });
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it('ignores a config with no version at all', () => {
    storeRaw(TRIVIA_CONFIG_KEY, JSON.stringify({ deck: ['two-sum'], mode: 'type' }));
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it('survives malformed JSON', () => {
    storeRaw(TRIVIA_CONFIG_KEY, '{ not json at all');
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it('survives a stored value that is not an object', () => {
    storeRaw(TRIVIA_CONFIG_KEY, '"choice"');
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it.each([
    ['a non-array deck', { deck: 'two-sum' }],
    ['a deck of non-strings', { deck: [1, 2] }],
    ['an unknown mode', { mode: 'guess' }],
    ['a null blank count', { minBlanks: null }],
    ['a fractional blank count', { minBlanks: 1.5 }],
    ['an out-of-range blank count', { maxBlanks: 99 }],
    ['an inverted blank range', { minBlanks: 4, maxBlanks: 2 }],
    ['a non-boolean distractor flag', { includeDistractors: 'yes' }],
  ])('discards a stored config with %s', (_label, override) => {
    storeConfigRaw({ ...validConfigPayload, ...override });
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it('rebuilds field by field so unknown stored keys never reach app state', () => {
    storeConfigRaw({ ...validConfigPayload, rogue: 'value' });
    expect(readTriviaConfig()).toEqual({
      deck: ['two-sum'],
      mode: 'type',
      minBlanks: 2,
      maxBlanks: 4,
      includeDistractors: false,
    });
  });
});

describe('trivia progress persistence', () => {
  it('falls back to a fresh progress record for the stored config', () => {
    writeTriviaConfig({ minBlanks: 3, maxBlanks: 5 });
    // The floor, not level 1: a restored drill resumes at the configured start.
    expect(readTriviaProgress()).toEqual(createProgress({ ...DEFAULT_TRIVIA_CONFIG, minBlanks: 3, maxBlanks: 5 }));
    expect(readTriviaProgress().level).toBe(3);
  });

  it('round-trips a progress record through storage', () => {
    const written = writeTriviaProgress(sampleProgress);
    expect(written).toEqual(sampleProgress);
    expect(readTriviaProgress()).toEqual(sampleProgress);
  });

  it('stores a deep copy, so later mutation of the argument cannot leak in', () => {
    const progress = writeTriviaProgress(sampleProgress);
    progress.drilled['two-sum']['2'].push(9);
    expect(readTriviaProgress().drilled['two-sum']['2']).toEqual([3, 5]);
  });

  it('clamps a level outside the engine range before storing it', () => {
    expect(writeTriviaProgress({ ...sampleProgress, level: 99 }).level).toBe(MAX_BLANKS_CEILING);
    expect(writeTriviaProgress({ ...sampleProgress, level: Number.NaN }).level).toBe(1);
    expect(readTriviaProgress().level).toBe(1);
  });

  it('ignores progress written by a different version', () => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION + 1, ...sampleProgress });
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it('survives malformed progress JSON', () => {
    storeRaw(TRIVIA_PROGRESS_KEY, 'nonsense]');
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it.each([
    ['a level out of range', { level: 0 }],
    ['a non-integer round count', { roundsPlayed: 2.5 }],
    ['a negative round count', { roundsPlayed: -1 }],
    ['a non-boolean completion flag', { completed: 'no' }],
    ['a non-object drilled map', { drilled: [] }],
    ['a drilled map keyed by a non-level', { drilled: { 'two-sum': { high: [1] } } }],
    ['drilled line numbers that are not line numbers', { drilled: { 'two-sum': { '2': ['x'] } } }],
    ['a zero drilled line number', { drilled: { 'two-sum': { '2': [0] } } }],
    ['a non-object stats map', { stats: 4 }],
    ['a stat with a missing tally', { stats: { 'two-sum': { '3': { attempts: 1 } } } }],
    ['more misses than attempts', { stats: { 'two-sum': { '3': { attempts: 1, misses: 2 } } } }],
  ])('discards stored progress with %s', (_label, override) => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION, ...sampleProgress, ...override });
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it('rebuilds progress field by field so unknown stored keys never reach app state', () => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION, ...sampleProgress, rogue: true });
    expect(readTriviaProgress()).toEqual(sampleProgress);
  });
});

describe('trivia storage failures and reset', () => {
  it('returns defaults and never throws when reads are blocked', () => {
    writeTriviaConfig({ deck: ['two-sum'], minBlanks: 2 });
    writeTriviaProgress(sampleProgress);

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => readTriviaConfig()).not.toThrow();
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it('keeps working in memory when writes are blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(writeTriviaConfig({ mode: 'type' })).toMatchObject({ mode: 'type' });
    expect(writeTriviaProgress(sampleProgress)).toEqual(sampleProgress);
    expect(setItem).toHaveBeenCalled();
    // Nothing landed, so the next read is the default — and still does not throw.
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it('never throws when the reset itself is blocked', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(() => clearTrivia()).not.toThrow();
  });

  it('clears both keys on an explicit reset', () => {
    writeTriviaConfig({ deck: ['two-sum'], mode: 'type' });
    writeTriviaProgress(sampleProgress);
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).not.toBeNull();

    clearTrivia();

    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it('writes under the documented versioned keys', () => {
    writeTriviaConfig({ mode: 'type' });
    writeTriviaProgress(sampleProgress);

    expect(TRIVIA_CONFIG_KEY).toBe('dsa_visualizer_trivia_config_v1');
    expect(TRIVIA_PROGRESS_KEY).toBe('dsa_visualizer_trivia_progress_v1');
    const rawConfig: unknown = JSON.parse(window.localStorage.getItem(TRIVIA_CONFIG_KEY) ?? 'null');
    expect(rawConfig).toMatchObject({ version: TRIVIA_STORAGE_VERSION });
  });
});
