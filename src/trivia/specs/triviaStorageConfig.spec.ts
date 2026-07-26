import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TRIVIA_CONFIG, MAX_BLANKS_CEILING } from "../triviaEngine";
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_STORAGE_VERSION,
  readTriviaConfig,
  writeTriviaConfig,
} from "../triviaStorage";

const storeRaw = (key: string, raw: string): void => {
  window.localStorage.setItem(key, raw);
};

type RawTestPayload = Record<
  string,
  string | number | boolean | null | Record<string, unknown> | Array<unknown>
>;

const storeConfigRaw = (payload: RawTestPayload): void => {
  storeRaw(TRIVIA_CONFIG_KEY, JSON.stringify(payload));
};

const validConfigPayload = {
  version: TRIVIA_STORAGE_VERSION,
  deck: ["two-sum"],
  mode: "type",
  minBlanks: 2,
  maxBlanks: 4,
  includeDistractors: false,
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("trivia config persistence", () => {
  it("falls back to the engine defaults when nothing is stored", () => {
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
    expect(readTriviaConfig()).not.toBe(DEFAULT_TRIVIA_CONFIG);
  });

  it("round-trips a full config through storage", () => {
    const written = writeTriviaConfig({
      deck: ["two-sum", "bfs-graph"],
      mode: "type",
      minBlanks: 2,
      maxBlanks: 5,
      includeDistractors: false,
    });

    expect(written).toEqual({
      deck: ["two-sum", "bfs-graph"],
      mode: "type",
      minBlanks: 2,
      maxBlanks: 5,
      includeDistractors: false,
    });
    expect(readTriviaConfig()).toEqual(written);
  });

  it("merges a partial patch onto the stored config", () => {
    writeTriviaConfig({ deck: ["two-sum"], mode: "type", minBlanks: 3, maxBlanks: 6 });
    writeTriviaConfig({ mode: "choice" });

    expect(readTriviaConfig()).toEqual({
      deck: ["two-sum"],
      mode: "choice",
      minBlanks: 3,
      maxBlanks: 6,
      includeDistractors: DEFAULT_TRIVIA_CONFIG.includeDistractors,
    });
  });

  it("persists an explicit false rather than treating it as absent", () => {
    writeTriviaConfig({ includeDistractors: false });
    expect(readTriviaConfig().includeDistractors).toBe(false);
  });

  it("normalises an inverted or out-of-range blank range through the engine", () => {
    expect(writeTriviaConfig({ minBlanks: 6, maxBlanks: 2 })).toMatchObject({
      minBlanks: 6,
      maxBlanks: 6,
    });
    expect(
      writeTriviaConfig({
        minBlanks: MAX_BLANKS_CEILING + 500,
        maxBlanks: MAX_BLANKS_CEILING + 500,
      }),
    ).toMatchObject({
      minBlanks: MAX_BLANKS_CEILING,
      maxBlanks: MAX_BLANKS_CEILING,
    });
  });

  it("de-duplicates deck ids on write", () => {
    expect(writeTriviaConfig({ deck: ["two-sum", "two-sum", "bfs-graph"] }).deck).toEqual([
      "two-sum",
      "bfs-graph",
    ]);
  });

  it("ignores a stored config written by a different version", () => {
    storeConfigRaw({ ...validConfigPayload, version: TRIVIA_STORAGE_VERSION + 1 });
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it("ignores a config with no version at all", () => {
    storeRaw(TRIVIA_CONFIG_KEY, JSON.stringify({ deck: ["two-sum"], mode: "type" }));
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it("survives malformed JSON", () => {
    storeRaw(TRIVIA_CONFIG_KEY, "{ not json at all");
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it("survives a stored value that is not an object", () => {
    storeRaw(TRIVIA_CONFIG_KEY, '"choice"');
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it.each([
    ["a non-array deck", { deck: "two-sum" }],
    ["a deck of non-strings", { deck: [1, 2] }],
    ["an unknown mode", { mode: "guess" }],
    ["a null blank count", { minBlanks: null }],
    ["a fractional blank count", { minBlanks: 1.5 }],
    ["an out-of-range blank count", { maxBlanks: MAX_BLANKS_CEILING + 500 }],
    ["an inverted blank range", { minBlanks: 4, maxBlanks: 2 }],
    ["a non-boolean distractor flag", { includeDistractors: "yes" }],
  ])("discards a stored config with %s", (_label, override) => {
    storeConfigRaw({ ...validConfigPayload, ...override });
    expect(readTriviaConfig()).toEqual(DEFAULT_TRIVIA_CONFIG);
  });

  it("rebuilds field by field so unknown stored keys never reach app state", () => {
    storeConfigRaw({ ...validConfigPayload, rogue: "value" });
    expect(readTriviaConfig()).toEqual({
      deck: ["two-sum"],
      mode: "type",
      minBlanks: 2,
      maxBlanks: 4,
      includeDistractors: false,
    });
  });
});
