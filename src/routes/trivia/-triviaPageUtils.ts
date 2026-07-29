import type { CSSProperties } from "react";
import type { PuzzleLine, TriviaConfig, TriviaMeta, TriviaProgress } from "../../types/trivia";
import { getLearningItem } from "../../learning/registry";
import { isTriviaEligibleLearningItem } from "../../learning/types";
import { isLevelCovered, parsePuzzleLines } from "../../trivia/triviaEngine";
import type { TriviaPanelHeights } from "../../trivia/triviaLayout";

export const PANEL_BORDER: CSSProperties = { borderColor: "var(--border-default)" };

export const pageStyle: CSSProperties = {
  padding: "var(--space-8) var(--space-10)",
  maxWidth: "1280px",
  margin: "0 auto",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-6)",
  minHeight: 0,
};

export const hintStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--text-muted)",
  lineHeight: 1.5,
};

export interface DeckSources {
  sources: Map<string, PuzzleLine[]>;
  meta: Map<string, TriviaMeta | undefined>;
}

export const reviveProgressForConfig = (
  priorProgress: TriviaProgress,
  nextConfig: TriviaConfig,
): TriviaProgress => {
  if (!priorProgress.completed) return priorProgress;

  const nextSources = new Map<string, PuzzleLine[]>();
  nextConfig.deck.forEach((id) => {
    const item = getLearningItem(id);
    if (!item || !isTriviaEligibleLearningItem(item)) return;
    nextSources.set(id, parsePuzzleLines(item.code, item.trivia));
  });
  if (nextSources.size === 0) return priorProgress;

  for (let lvl = nextConfig.minBlanks; lvl <= nextConfig.maxBlanks; lvl++) {
    if (!isLevelCovered(priorProgress, nextSources, lvl)) {
      return { ...priorProgress, completed: false, level: lvl };
    }
  }
  return priorProgress;
};

export const buildSessionListPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  sessionList: value,
});
export const buildDeckBuilderPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  deckBuilder: value,
});
export const buildSettingsPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  settings: value,
});
