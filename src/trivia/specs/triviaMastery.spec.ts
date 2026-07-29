import { describe, expect, it } from "vitest";

import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaProgress,
  TriviaRound,
} from "../../types/trivia";
import {
  classifyPuzzleLine,
  createProgress,
  dueReviewLines,
  gradeRound,
  masteryRatio,
  parsePuzzleLines,
  pickRound,
  recordRetrievalReview,
} from "../triviaEngine";

const DAY_MS = 86_400_000;
const config: TriviaConfig = {
  deck: ["semantic-example"],
  mode: "type",
  minBlanks: 1,
  maxBlanks: 1,
  includeDistractors: false,
};

describe("mastery-oriented trivia", () => {
  it("classifies code lines so state transitions and boundaries outrank boilerplate", () => {
    expect(classifyPuzzleLine("import math")).toEqual({
      role: "boilerplate",
      semanticWeight: 1,
    });
    expect(classifyPuzzleLine("if value < 0:")).toEqual({
      role: "boundary",
      semanticWeight: 4,
    });
    expect(classifyPuzzleLine("running += value")).toEqual({
      role: "state-update",
      semanticWeight: 4,
    });
    expect(classifyPuzzleLine("return running")).toEqual({
      role: "result",
      semanticWeight: 3,
    });
  });

  it("accepts only canonical text or explicitly authored equivalent expressions", () => {
    const round: TriviaRound = {
      algorithmId: "semantic-example",
      level: 1,
      lines: parsePuzzleLines("def nonempty(values):\n    return len(values) > 0"),
      blanks: [2],
      tiles: [],
      acceptedAnswers: { 2: ["return bool(values)", "return len(values) != 0"] },
    };

    expect(gradeRound(round, { 2: "return bool(values)" }).allCorrect).toBe(true);
    expect(gradeRound(round, { 2: "return len(values) == 0" }).allCorrect).toBe(false);
  });

  it("prefers an authored semantic line and carries its changed variant and follow-up", () => {
    const lines = parsePuzzleLines("import math\nvalue = seed\nif value < 0:\n    value = 0", {
      semanticLines: [
        {
          line: 3,
          role: "boundary",
          misconceptionCode: "misses-negative-boundary",
          acceptedAnswers: ["if 0 > value:"],
          predictionPrompt: "What output changes when value is exactly zero?",
        },
      ],
    });
    const sources = new Map<string, readonly PuzzleLine[]>([["semantic-example", lines]]);
    const meta = new Map([
      [
        "semantic-example",
        {
          semanticLines: [
            {
              line: 3,
              role: "boundary" as const,
              misconceptionCode: "misses-negative-boundary",
              acceptedAnswers: ["if 0 > value:"],
              predictionPrompt: "What output changes when value is exactly zero?",
            },
          ],
        },
      ],
    ]);

    const round = pickRound({
      config,
      progress: createProgress(config),
      sources,
      meta,
      rng: () => 0.6,
    });

    expect(round).toMatchObject({
      blanks: [3],
      variant: "semantic-example-line-3-prediction",
      retrievalPrompt: {
        kind: "prediction",
        prompt: "What output changes when value is exactly zero?",
      },
      acceptedAnswers: { 3: ["if 0 > value:"] },
      misconceptionCodes: { 3: "misses-negative-boundary" },
    });
  });

  it("schedules successful retrieval at 1, 7, and 24 days before mastery", () => {
    const now = 1_800_000_000_000;
    const round = masteryRound();
    const grade: TriviaGrade = { perBlank: { 2: true }, allCorrect: true };
    let progress = progressWithAttempt(config, 2, 1, 0);

    progress = recordRetrievalReview(
      progress,
      round,
      grade,
      { confidence: 5, response: "The accumulator equals the processed prefix sum." },
      now,
    );
    expect(dueReviewLines(progress, "semantic-example", now)).toEqual([]);
    expect(dueReviewLines(progress, "semantic-example", now + DAY_MS)).toEqual([2]);

    progress = recordRetrievalReview(
      progressWithStats(progress, 2, 2, 0),
      round,
      grade,
      { confidence: 4, response: "The accumulator remains the processed prefix sum." },
      now + DAY_MS,
    );
    expect(dueReviewLines(progress, "semantic-example", now + 8 * DAY_MS)).toEqual([2]);

    progress = recordRetrievalReview(
      progressWithStats(progress, 2, 3, 0),
      round,
      grade,
      { confidence: 4, response: "The prefix invariant still determines the result." },
      now + 8 * DAY_MS,
    );
    expect(dueReviewLines(progress, "semantic-example", now + 32 * DAY_MS)).toEqual([2]);

    progress = recordRetrievalReview(
      progressWithStats(progress, 2, 4, 0),
      round,
      grade,
      { confidence: 5, response: "The same invariant holds in the changed context." },
      now + 32 * DAY_MS,
    );
    expect(dueReviewLines(progress, "semantic-example", now + 100 * DAY_MS)).toEqual([]);
    expect(masteryRatio(progress)).toBe(1);
  });

  it("resets a low-confidence or missed line to the one-day queue with a misconception code", () => {
    const now = 1_800_000_000_000;
    const round = masteryRound();
    const grade: TriviaGrade = {
      perBlank: { 2: false },
      allCorrect: false,
      misconceptionCodes: ["drops-prefix-invariant"],
    };
    const progress = recordRetrievalReview(
      progressWithAttempt(config, 2, 5, 1),
      round,
      grade,
      { confidence: 2, response: "I changed state before reading the old value." },
      now,
    );

    expect(progress.reviews?.["semantic-example"]?.["2"]).toMatchObject({
      intervalIndex: 0,
      dueAt: now + DAY_MS,
      confidence: 2,
      mastered: false,
      misconceptionCodes: ["drops-prefix-invariant"],
    });
  });
});

function masteryRound(): TriviaRound {
  return {
    algorithmId: "semantic-example",
    level: 1,
    lines: parsePuzzleLines("def total(values):\n    running += value\n    return running"),
    blanks: [2],
    tiles: [],
    variant: "semantic-example-line-2-invariant",
    retrievalPrompt: {
      kind: "invariant",
      prompt: "State the accumulator invariant after this update.",
    },
    misconceptionCodes: { 2: "drops-prefix-invariant" },
  };
}

function progressWithAttempt(
  sourceConfig: TriviaConfig,
  line: number,
  attempts: number,
  misses: number,
): TriviaProgress {
  return progressWithStats(createProgress(sourceConfig), line, attempts, misses);
}

function progressWithStats(
  progress: TriviaProgress,
  line: number,
  attempts: number,
  misses: number,
): TriviaProgress {
  return {
    ...progress,
    stats: {
      ...progress.stats,
      "semantic-example": {
        ...(progress.stats["semantic-example"] ?? {}),
        [line]: { attempts, misses },
      },
    },
  };
}
