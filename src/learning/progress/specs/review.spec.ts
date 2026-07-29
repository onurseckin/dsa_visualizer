import { describe, expect, it } from "vitest";

import { createReviewedAttempt } from "../review";
import { createAttemptRecord } from "../types";

const pendingAttempt = createAttemptRecord({
  itemId: "platform-design",
  mode: "scenario",
  variant: "changed-context",
  response: { decision: "Canary release" },
  gradingStatus: "pending",
  score: 0,
  rubric: [
    { id: "invariant", score: 0, maxScore: 2, feedback: "Pending review." },
    { id: "rollback", score: 0, maxScore: 1, feedback: "Pending review." },
  ],
  criticalFailures: [],
  confidence: 4,
  misconceptionCodes: [],
  repairedMisconceptionCodes: [],
  isomorphicRetest: true,
  changedContext: true,
  invariantEvidence: "Only compatible artifacts may advance.",
  tradeoffEvidence: "Canaries cost capacity but bound blast radius.",
  createdAt: 100,
  updatedAt: 100,
});

describe("assessment self-review", () => {
  it("normalizes weighted rubric points and preserves critical failures", () => {
    const reviewed = createReviewedAttempt({
      attempt: { ...pendingAttempt, criticalFailures: ["prior-failure"] },
      criteria: [
        { id: "invariant", label: "Invariant", points: 2, critical: true },
        { id: "rollback", label: "Rollback", points: 1 },
      ],
      metCriteria: ["rollback"],
      updatedAt: 150,
    });

    expect(reviewed).toMatchObject({
      gradingStatus: "graded",
      score: 1 / 3,
      criticalFailures: ["prior-failure", "invariant"],
      createdAt: 100,
      updatedAt: 150,
      rubric: [
        { id: "invariant", score: 0, maxScore: 2 },
        { id: "rollback", score: 1, maxScore: 1 },
      ],
    });
  });

  it("requires an existing pending rubric and canonical selected criterion ids", () => {
    expect(() =>
      createReviewedAttempt({
        attempt: pendingAttempt,
        criteria: [{ id: "other", label: "Other", points: 1 }],
        metCriteria: ["other"],
        updatedAt: 150,
      }),
    ).toThrow(/rubric/i);
    expect(() =>
      createReviewedAttempt({
        attempt: pendingAttempt,
        criteria: [
          { id: "invariant", label: "Invariant", points: 2, critical: true },
          { id: "rollback", label: "Rollback", points: 1 },
        ],
        metCriteria: ["unknown"],
        updatedAt: 150,
      }),
    ).toThrow(/criterion/i);
  });
});
