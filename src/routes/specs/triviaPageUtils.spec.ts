import { describe, expect, it } from "vitest";
import {
  PANEL_BORDER,
  buildDeckBuilderPatch,
  buildSessionListPatch,
  buildSettingsPatch,
  hintStyle,
  pageStyle,
  reviveProgressForConfig,
} from "../trivia/-triviaPageUtils";
import type { TriviaConfig, TriviaProgress } from "../../types/trivia";
import { getLearningItem } from "../../learning/registry";
import { isTriviaEligibleLearningItem } from "../../learning/types";
import { blankableLines, parsePuzzleLines } from "../../trivia/triviaEngine";

describe("triviaPageUtils", () => {
  it("exports styles and patch builders", () => {
    expect(PANEL_BORDER).toBeDefined();
    expect(pageStyle).toBeDefined();
    expect(hintStyle).toBeDefined();

    expect(buildSessionListPatch(150)).toEqual({ sessionList: 150 });
    expect(buildDeckBuilderPatch(200)).toEqual({ deckBuilder: 200 });
    expect(buildSettingsPatch(null)).toEqual({ settings: null });
  });

  describe("reviveProgressForConfig", () => {
    const bubbleSortItem = getLearningItem("bubble-sort")!;
    if (!isTriviaEligibleLearningItem(bubbleSortItem)) {
      throw new Error("bubble-sort must remain eligible for Trivia");
    }
    const allBlankable = blankableLines(
      parsePuzzleLines(bubbleSortItem.code, bubbleSortItem.trivia),
    );

    const uncompletedProgress: TriviaProgress = {
      level: 1,
      drilled: {},
      stats: {},
      completed: false,
      roundsPlayed: 1,
    };

    const completedProgress: TriviaProgress = {
      level: 3,
      drilled: {
        "bubble-sort": {
          "1": [...allBlankable],
          "2": [...allBlankable],
          "3": [...allBlankable],
        },
      },
      stats: {},
      completed: true,
      roundsPlayed: 5,
    };

    const baseConfig: TriviaConfig = {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 3,
      includeDistractors: false,
    };

    it("returns priorProgress directly if not completed", () => {
      expect(reviveProgressForConfig(uncompletedProgress, baseConfig)).toBe(uncompletedProgress);
    });

    it("returns priorProgress if nextConfig deck contains only invalid algorithm IDs", () => {
      const invalidConfig = { ...baseConfig, deck: ["non-existent-alg"] };
      expect(reviveProgressForConfig(completedProgress, invalidConfig)).toBe(completedProgress);
    });

    it("uncompletes progress if a new level range is introduced that is not covered", () => {
      const expandedConfig = { ...baseConfig, maxBlanks: 5 };
      const revived = reviveProgressForConfig(completedProgress, expandedConfig);
      expect(revived.completed).toBe(false);
      expect(revived.level).toBe(4);
    });

    it("keeps priorProgress completed if all new levels in min..max are covered", () => {
      const tightConfig = { ...baseConfig, minBlanks: 1, maxBlanks: 2 };
      const revived = reviveProgressForConfig(completedProgress, tightConfig);
      expect(revived).toBe(completedProgress);
    });
  });
});
