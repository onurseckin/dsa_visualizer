import type { TriviaConfig } from "../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG, normalizeConfig } from "../triviaEngine";
import {
  TRIVIA_CONFIG_KEY,
  cloneTriviaConfig,
  isBlankCount,
  isMode,
  readDeck,
  readVersioned,
  writeVersioned,
} from "./storageHelpers";

/** Never throws: any unreadable, stale, malformed or out-of-range value yields defaults. */
export function readTriviaConfig(): TriviaConfig {
  const parsed = readVersioned(TRIVIA_CONFIG_KEY);
  if (parsed === null) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);

  const deck = readDeck(parsed.deck);
  if (deck === null) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (!isMode(parsed.mode)) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (!isBlankCount(parsed.minBlanks) || !isBlankCount(parsed.maxBlanks)) {
    return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  }
  if (parsed.maxBlanks < parsed.minBlanks) return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  if (typeof parsed.includeDistractors !== "boolean") {
    return cloneTriviaConfig(DEFAULT_TRIVIA_CONFIG);
  }

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return {
    deck,
    mode: parsed.mode,
    minBlanks: parsed.minBlanks,
    maxBlanks: parsed.maxBlanks,
    includeDistractors: parsed.includeDistractors,
  };
}

/**
 * Merges the patch onto whatever is stored, normalises it through the engine so
 * min <= max always holds, writes best-effort, and returns the stored result.
 *
 * An absent key means "leave it alone"; there is no null-means-default here
 * because every trivia setting has a concrete value.
 */
export function writeTriviaConfig(patch: Partial<TriviaConfig>): TriviaConfig {
  const current = readTriviaConfig();
  const deck = patch.deck === undefined ? current.deck : (readDeck(patch.deck) ?? current.deck);

  const merged = normalizeConfig({
    deck,
    mode: patch.mode ?? current.mode,
    minBlanks: patch.minBlanks ?? current.minBlanks,
    maxBlanks: patch.maxBlanks ?? current.maxBlanks,
    // `??` and not `||`: turning distractors off patches an explicit false.
    includeDistractors: patch.includeDistractors ?? current.includeDistractors,
  });

  const stored = cloneTriviaConfig(merged);
  writeVersioned(TRIVIA_CONFIG_KEY, {
    deck: stored.deck,
    mode: stored.mode,
    minBlanks: stored.minBlanks,
    maxBlanks: stored.maxBlanks,
    includeDistractors: stored.includeDistractors,
  });
  return stored;
}
