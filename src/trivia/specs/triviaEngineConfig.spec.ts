import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIVIA_CONFIG,
  MAX_BLANKS_CEILING,
  MIN_BLANKS_FLOOR,
  createProgress,
  normalizeConfig,
} from "../triviaEngine";
import type { TriviaConfig } from "../../types/trivia";

const configOf = (overrides: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...overrides,
});

describe("normalizeConfig", () => {
  it("clamps minBlanks up to the floor", () => {
    expect(normalizeConfig(configOf({ minBlanks: 0, maxBlanks: 3 })).minBlanks).toBe(
      MIN_BLANKS_FLOOR,
    );
    expect(normalizeConfig(configOf({ minBlanks: -7, maxBlanks: 3 })).minBlanks).toBe(
      MIN_BLANKS_FLOOR,
    );
  });

  it("clamps minBlanks down to the ceiling and drags maxBlanks with it", () => {
    const normalized = normalizeConfig(
      configOf({ minBlanks: MAX_BLANKS_CEILING + 500, maxBlanks: 3 }),
    );

    expect(normalized.minBlanks).toBe(MAX_BLANKS_CEILING);
    expect(normalized.maxBlanks).toBe(MAX_BLANKS_CEILING);
  });

  it("never lets maxBlanks fall below minBlanks", () => {
    expect(normalizeConfig(configOf({ minBlanks: 4, maxBlanks: 2 }))).toMatchObject({
      minBlanks: 4,
      maxBlanks: 4,
    });
    expect(normalizeConfig(configOf({ minBlanks: 4, maxBlanks: -100 }))).toMatchObject({
      minBlanks: 4,
      maxBlanks: 4,
    });
  });

  it("clamps an out-of-range maxBlanks to the ceiling", () => {
    expect(normalizeConfig(configOf({ minBlanks: 1, maxBlanks: 500 })).maxBlanks).toBe(
      MAX_BLANKS_CEILING,
    );
  });

  it("falls back to the lower bound for non-finite values", () => {
    expect(normalizeConfig(configOf({ minBlanks: Number.NaN, maxBlanks: 3 }))).toMatchObject({
      minBlanks: MIN_BLANKS_FLOOR,
      maxBlanks: 3,
    });
    expect(
      normalizeConfig(configOf({ minBlanks: 2, maxBlanks: Number.POSITIVE_INFINITY })),
    ).toMatchObject({ minBlanks: 2, maxBlanks: 2 });
    expect(
      normalizeConfig(configOf({ minBlanks: Number.NEGATIVE_INFINITY, maxBlanks: Number.NaN })),
    ).toMatchObject({ minBlanks: MIN_BLANKS_FLOOR, maxBlanks: MIN_BLANKS_FLOOR });
  });

  it("rounds fractional values to whole blanks", () => {
    expect(normalizeConfig(configOf({ minBlanks: 2.4, maxBlanks: 3.5 }))).toMatchObject({
      minBlanks: 2,
      maxBlanks: 4,
    });
  });

  it("preserves every other field and leaves the input untouched", () => {
    const config = configOf({
      deck: ["two-sum"],
      mode: "type",
      includeDistractors: false,
      minBlanks: 0,
      maxBlanks: MAX_BLANKS_CEILING + 500,
    });
    const before = JSON.stringify(config);

    expect(normalizeConfig(config)).toEqual({
      deck: ["two-sum"],
      mode: "type",
      includeDistractors: false,
      minBlanks: MIN_BLANKS_FLOOR,
      maxBlanks: MAX_BLANKS_CEILING,
    });
    expect(JSON.stringify(config)).toBe(before);
  });
});

describe("createProgress", () => {
  it("starts at the normalized floor with an empty history", () => {
    expect(createProgress(configOf({ minBlanks: 2, maxBlanks: 5 }))).toEqual({
      level: 2,
      drilled: {},
      stats: {},
      completed: false,
      roundsPlayed: 0,
    });
  });

  it("normalizes a garbage floor before using it as the starting level", () => {
    expect(createProgress(configOf({ minBlanks: 0, maxBlanks: 3 })).level).toBe(MIN_BLANKS_FLOOR);
  });
});
