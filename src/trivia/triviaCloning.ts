import type { TriviaConfig, TriviaLineStat, TriviaProgress } from "../types/trivia";

export function cloneTriviaConfig(config: TriviaConfig): TriviaConfig {
  return {
    deck: [...config.deck],
    mode: config.mode,
    minBlanks: config.minBlanks,
    maxBlanks: config.maxBlanks,
    includeDistractors: config.includeDistractors,
  };
}

export function cloneTriviaProgress(progress: TriviaProgress): TriviaProgress {
  const drilled: TriviaProgress["drilled"] = {};
  for (const [algorithmId, levels] of Object.entries(progress.drilled)) {
    const copy: Record<string, number[]> = {};
    for (const [level, lines] of Object.entries(levels)) copy[level] = [...lines];
    drilled[algorithmId] = copy;
  }

  const stats: TriviaProgress["stats"] = {};
  for (const [algorithmId, lines] of Object.entries(progress.stats)) {
    const copy: Record<string, TriviaLineStat> = {};
    for (const [line, stat] of Object.entries(lines)) {
      copy[line] = { attempts: stat.attempts, misses: stat.misses };
    }
    stats[algorithmId] = copy;
  }

  return {
    level: progress.level,
    drilled,
    stats,
    completed: progress.completed,
    roundsPlayed: progress.roundsPlayed,
  };
}
