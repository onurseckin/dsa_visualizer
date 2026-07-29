import { describe, expect, it } from "vitest";

import { DEFAULT_MASTERY_POLICY, evaluateMastery, nextRetrieval } from "../grading";
import { createAttemptRecord } from "../types";

const day = 86_400_000;

const attempt = (overrides: Record<string, unknown> = {}) =>
  createAttemptRecord({
    itemId: "point-in-time-join",
    mode: "trace",
    variant: "default",
    response: { answer: "correct" },
    score: 0.9,
    rubric: [{ id: "reasoning", score: 0.9, maxScore: 1 }],
    criticalFailures: [],
    confidence: 4,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    changedContext: false,
    invariantEvidence: "Features precede the label timestamp.",
    tradeoffEvidence: "Stricter joins can reduce available data.",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  });

describe("mastery grading", () => {
  it("requires threshold, two modes, changed context, evidence, and delayed retrieval", () => {
    const records = [
      attempt(),
      attempt({ mode: "debugging", createdAt: day, updatedAt: day }),
      attempt({
        mode: "scenario",
        variant: "changed-context",
        changedContext: true,
        createdAt: 7 * day,
        updatedAt: 7 * day,
      }),
      attempt({
        mode: "trace",
        variant: "delayed-retrieval",
        delayedRetrievalDueAt: day,
        delayedRetrievalCompletedAt: day,
        createdAt: day,
        updatedAt: day,
      }),
    ];

    expect(evaluateMastery(records)).toMatchObject({
      mastered: true,
      unresolvedCriticalFailures: [],
    });
    expect(nextRetrieval(records, DEFAULT_MASTERY_POLICY)).toMatchObject({ dueAt: 7 * day });
  });

  it("does not average away a critical failure until an isomorphic retest repairs it", () => {
    const records = [
      attempt({ criticalFailures: ["target-leakage"], score: 1, createdAt: 0, updatedAt: 0 }),
      attempt({ mode: "debugging", createdAt: day, updatedAt: day }),
      attempt({ mode: "scenario", changedContext: true, createdAt: 7 * day, updatedAt: 7 * day }),
      attempt({
        delayedRetrievalDueAt: day,
        delayedRetrievalCompletedAt: day,
        createdAt: day,
        updatedAt: day,
      }),
    ];

    expect(evaluateMastery(records).mastered).toBe(false);
    expect(evaluateMastery(records).unresolvedCriticalFailures).toEqual(["target-leakage"]);

    expect(
      evaluateMastery([
        ...records,
        attempt({
          mode: "debugging",
          variant: "isomorphic-retest",
          repairedMisconceptionCodes: ["target-leakage"],
          createdAt: 8 * day,
          updatedAt: 8 * day,
        }),
      ]).mastered,
    ).toBe(true);
  });
});
