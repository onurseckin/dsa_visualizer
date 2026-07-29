import { describe, expect, it } from "vitest";

import {
  DEFAULT_MASTERY_POLICY,
  createMasteryScope,
  evaluateMastery,
  getUnresolvedCriticalFailures,
  nextRetrieval,
} from "../grading";
import { createAttemptRecord } from "../types";

const day = 86_400_000;
const scope = createMasteryScope({
  targetId: "leakage-repair",
  itemIds: ["point-in-time-join"],
});

const attempt = (overrides: Record<string, unknown> = {}) =>
  createAttemptRecord({
    itemId: "point-in-time-join",
    mode: "trace",
    variant: "default",
    response: { answer: "correct" },
    gradingStatus: "graded",
    score: 0.9,
    rubric: [{ id: "reasoning", score: 0.9, maxScore: 1 }],
    criticalFailures: [],
    confidence: 4,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    isomorphicRetest: false,
    changedContext: false,
    invariantEvidence: "Features precede the label timestamp.",
    tradeoffEvidence: "",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  });

const masteredRecords = () => [
  attempt(),
  attempt({ mode: "debugging", variant: "debug", createdAt: day, updatedAt: day }),
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

describe("mastery grading", () => {
  it("uses an explicit scope and accepts governing invariant OR tradeoff evidence", () => {
    expect(evaluateMastery(masteredRecords(), scope)).toMatchObject({
      mastered: true,
      unresolvedCriticalFailures: [],
      hasRequiredEvidence: true,
    });
    expect(nextRetrieval(masteredRecords(), scope, DEFAULT_MASTERY_POLICY)).toMatchObject({
      dueAt: 7 * day,
    });
  });

  it("rejects empty, duplicate, or noncanonical mastery scopes", () => {
    expect(() => createMasteryScope({ targetId: "topic", itemIds: [] } as never)).toThrow(/scope/i);
    expect(() =>
      createMasteryScope({ targetId: "topic", itemIds: ["valid-item", "valid-item"] }),
    ).toThrow(/scope/i);
    expect(() => createMasteryScope({ targetId: "not valid", itemIds: ["valid-item"] })).toThrow(
      /scope/i,
    );
  });

  it("does not combine successful attempts from unrelated item IDs", () => {
    const records = [
      attempt(),
      attempt({
        itemId: "unrelated-item",
        mode: "debugging",
        variant: "unrelated-debug",
        changedContext: true,
        delayedRetrievalDueAt: day,
        delayedRetrievalCompletedAt: day,
        createdAt: day,
        updatedAt: day,
      }),
    ];

    expect(evaluateMastery(records, scope).mastered).toBe(false);
    expect(evaluateMastery(records, scope).passingModes).toEqual(["trace"]);
  });

  it("accepts delayed retrieval only on an exact configured due date", () => {
    const almostOneDay = masteredRecords().map((record, index) =>
      index === 3
        ? attempt({
            mode: "trace",
            variant: "almost-delayed",
            delayedRetrievalDueAt: day + 1,
            delayedRetrievalCompletedAt: day + 1,
            createdAt: day,
            updatedAt: day,
          })
        : record,
    );

    expect(evaluateMastery(almostOneDay, scope).delayedRetrievalCompleted).toBe(false);
    expect(evaluateMastery(masteredRecords(), scope).delayedRetrievalCompleted).toBe(true);
  });

  it("does not accept an authored future completion timestamp on a premature attempt", () => {
    const prematureRecords = [
      attempt(),
      attempt({
        mode: "debugging",
        variant: "premature-retrieval",
        changedContext: true,
        delayedRetrievalDueAt: day,
        delayedRetrievalCompletedAt: day,
        createdAt: 0,
        updatedAt: 0,
      }),
    ];

    expect(evaluateMastery(prematureRecords, scope)).toMatchObject({
      mastered: false,
      delayedRetrievalCompleted: false,
    });
    expect(nextRetrieval(prematureRecords, scope)).toEqual({ dueAt: day, intervalDays: 1 });
  });

  it("keeps pending submissions out of mastery even when their numeric score is high", () => {
    const pending = masteredRecords().map((record) =>
      attempt({
        ...record,
        gradingStatus: "pending",
        score: 1,
      }),
    );

    expect(evaluateMastery(pending, scope).mastered).toBe(false);
    expect(evaluateMastery(pending, scope).passingModes).toEqual([]);
  });

  it("repairs a critical failure only with an explicit same-item changed-variant isomorphic retest", () => {
    const repairScope = createMasteryScope({
      targetId: "critical-repair",
      itemIds: ["point-in-time-join", "unrelated-item"],
    });
    const failure = attempt({
      criticalFailures: ["target-leakage"],
      score: 1,
      createdAt: 0,
      updatedAt: 0,
    });
    const crossItemRepair = attempt({
      itemId: "unrelated-item",
      variant: "isomorphic-retest",
      changedContext: true,
      isomorphicRetest: true,
      repairedMisconceptionCodes: ["target-leakage"],
      createdAt: day,
      updatedAt: day,
    });
    const sameVariantRepair = attempt({
      variant: "default",
      changedContext: true,
      isomorphicRetest: true,
      repairedMisconceptionCodes: ["target-leakage"],
      createdAt: 2 * day,
      updatedAt: 2 * day,
    });
    const validRepair = attempt({
      variant: "changed-leakage-retest",
      changedContext: true,
      isomorphicRetest: true,
      repairedMisconceptionCodes: ["target-leakage"],
      createdAt: 3 * day,
      updatedAt: 3 * day,
    });

    expect(getUnresolvedCriticalFailures([failure, crossItemRepair], repairScope)).toEqual([
      "target-leakage",
    ]);
    expect(getUnresolvedCriticalFailures([failure, sameVariantRepair], repairScope)).toEqual([
      "target-leakage",
    ]);
    expect(getUnresolvedCriticalFailures([failure, validRepair], repairScope)).toEqual([]);
  });
});
