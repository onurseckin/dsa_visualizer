import type { TriviaConfig } from "../../types/trivia";

export const DEFAULT_TRIVIA_CONFIG: TriviaConfig = {
  deck: [],
  mode: "choice",
  minBlanks: 1,
  maxBlanks: 3,
  // Off by default — a learner who wants the extra recognition challenge opts
  // into distractor tiles rather than being opted in automatically.
  includeDistractors: false,
};

/* The floor stays at 1, never 0: a 0-blank round would ask pickRound for zero
   hidden lines, leaving buildTiles/grading nothing to check — not a drill at
   all — and eligible/blankableLines assume at least one blank per round. */
export const MIN_BLANKS_FLOOR = 1;
export const MAX_BLANKS_CEILING = 100;

export const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

/** Keeps min <= max and both inside the supported range. */
export const normalizeConfig = (config: TriviaConfig): TriviaConfig => {
  const minBlanks = clampInt(config.minBlanks, MIN_BLANKS_FLOOR, MAX_BLANKS_CEILING);
  const maxBlanks = clampInt(config.maxBlanks, minBlanks, MAX_BLANKS_CEILING);
  return { ...config, minBlanks, maxBlanks };
};
