import { afterEach, describe, expect, it, vi } from "vitest";
import type { TriviaProgress } from "../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG, MAX_BLANKS_CEILING, createProgress } from "../triviaEngine";
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_PROGRESS_KEY,
  TRIVIA_STORAGE_VERSION,
  clearTrivia,
  readTriviaConfig,
  readTriviaProgress,
  writeTriviaConfig,
  writeTriviaProgress,
} from "../triviaStorage";

const storeRaw = (key: string, raw: string): void => {
  window.localStorage.setItem(key, raw);
};

type RawTestPayload = Record<
  string,
  string | number | boolean | null | Record<string, unknown> | Array<unknown>
>;

const storeProgressRaw = (payload: RawTestPayload): void => {
  storeRaw(TRIVIA_PROGRESS_KEY, JSON.stringify(payload));
};

const sampleProgress: TriviaProgress = {
  level: 2,
  drilled: { "two-sum": { "2": [3, 5] }, "bfs-graph": { "2": [1] } },
  stats: { "two-sum": { "3": { attempts: 2, misses: 1 }, "5": { attempts: 1, misses: 0 } } },
  completed: false,
  roundsPlayed: 3,
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("trivia progress persistence", () => {
  it("falls back to a fresh progress record for the stored config", () => {
    writeTriviaConfig({ minBlanks: 3, maxBlanks: 5 });
    expect(readTriviaProgress()).toEqual(
      createProgress({ ...DEFAULT_TRIVIA_CONFIG, minBlanks: 3, maxBlanks: 5 }),
    );
    expect(readTriviaProgress().level).toBe(3);
  });

  it("round-trips a progress record through storage", () => {
    const written = writeTriviaProgress(sampleProgress);
    expect(written).toEqual(sampleProgress);
    expect(readTriviaProgress()).toEqual(sampleProgress);
  });

  it("stores a deep copy, so later mutation of the argument cannot leak in", () => {
    const progress = writeTriviaProgress(sampleProgress);
    progress.drilled["two-sum"]["2"].push(9);
    expect(readTriviaProgress().drilled["two-sum"]["2"]).toEqual([3, 5]);
  });

  it("clamps a level outside the engine range before storing it", () => {
    expect(writeTriviaProgress({ ...sampleProgress, level: MAX_BLANKS_CEILING + 500 }).level).toBe(
      MAX_BLANKS_CEILING,
    );
    expect(writeTriviaProgress({ ...sampleProgress, level: Number.NaN }).level).toBe(1);
    expect(readTriviaProgress().level).toBe(1);
  });

  it("ignores progress written by a different version", () => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION + 1, ...sampleProgress });
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it("survives malformed progress JSON", () => {
    storeRaw(TRIVIA_PROGRESS_KEY, "nonsense]");
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it.each([
    ["a level out of range", { level: 0 }],
    ["a non-integer round count", { roundsPlayed: 2.5 }],
    ["a negative round count", { roundsPlayed: -1 }],
    ["a non-boolean completion flag", { completed: "no" }],
    ["a non-object drilled map", { drilled: [] }],
    ["a drilled map keyed by a non-level", { drilled: { "two-sum": { high: [1] } } }],
    ["drilled line numbers that are not line numbers", { drilled: { "two-sum": { "2": ["x"] } } }],
    ["a zero drilled line number", { drilled: { "two-sum": { "2": [0] } } }],
    ["a non-object stats map", { stats: 4 }],
    ["a stat with a missing tally", { stats: { "two-sum": { "3": { attempts: 1 } } } }],
    ["more misses than attempts", { stats: { "two-sum": { "3": { attempts: 1, misses: 2 } } } }],
  ])("discards stored progress with %s", (_label, override) => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION, ...sampleProgress, ...override });
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it("rebuilds progress field by field so unknown stored keys never reach app state", () => {
    storeProgressRaw({ version: TRIVIA_STORAGE_VERSION, ...sampleProgress, rogue: true });
    expect(readTriviaProgress()).toEqual(sampleProgress);
  });
});

describe("trivia storage failures and reset", () => {
  it("returns defaults and never throws when reads are blocked", () => {
    writeTriviaConfig({ deck: ["two-sum"], minBlanks: 2 });
    writeTriviaProgress(sampleProgress);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(() => readTriviaConfig()).not.toThrow();
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it("keeps working in memory when writes are blocked", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(writeTriviaConfig({ mode: "type" })).toMatchObject({ mode: "type" });
    expect(writeTriviaProgress(sampleProgress)).toEqual(sampleProgress);
    expect(setItem).toHaveBeenCalled();
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it("never throws when the reset itself is blocked", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    expect(() => clearTrivia()).not.toThrow();
  });

  it("clears both keys on an explicit reset", () => {
    writeTriviaConfig({ deck: ["two-sum"], mode: "type" });
    writeTriviaProgress(sampleProgress);
    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).not.toBeNull();

    clearTrivia();

    expect(window.localStorage.getItem(TRIVIA_CONFIG_KEY)).toBeNull();
    expect(window.localStorage.getItem(TRIVIA_PROGRESS_KEY)).toBeNull();
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    expect(readTriviaProgress()).toEqual(createProgress(DEFAULT_TRIVIA_CONFIG));
  });

  it("writes under the documented versioned keys", () => {
    writeTriviaConfig({ mode: "type" });
    writeTriviaProgress(sampleProgress);

    expect(TRIVIA_CONFIG_KEY).toBe("dsa_visualizer_trivia_config_v1");
    expect(TRIVIA_PROGRESS_KEY).toBe("dsa_visualizer_trivia_progress_v1");
    const rawConfig: RawTestPayload | null = JSON.parse(
      window.localStorage.getItem(TRIVIA_CONFIG_KEY) ?? "null",
    );
    expect(rawConfig).toMatchObject({ version: TRIVIA_STORAGE_VERSION });
  });
});
