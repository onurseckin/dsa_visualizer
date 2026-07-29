import { describe, expect, it } from "vitest";

import { createAttemptRecord, isAssessmentAttemptRecord } from "../types";

const attemptInput = () => ({
  itemId: "queue-trace",
  mode: "trace" as const,
  variant: "default",
  response: { next: "A" },
  score: 0.9,
  rubric: [{ id: "prediction", score: 0.9, maxScore: 1 }] as const,
  criticalFailures: [],
  confidence: 4 as const,
  misconceptionCodes: [],
  repairedMisconceptionCodes: [],
  changedContext: false,
  invariantEvidence: "FIFO order is preserved.",
  tradeoffEvidence: "Fair scheduling may increase queueing delay.",
  delayedRetrievalDueAt: 86_400_000,
  delayedRetrievalCompletedAt: 86_400_000,
  createdAt: 0,
  updatedAt: 0,
});

describe("assessment attempt records", () => {
  it("rejects non-JSON response objects and unknown record fields", () => {
    expect(() => createAttemptRecord({ ...attemptInput(), response: new Date() } as never)).toThrow(
      /progress contract/i,
    );
    expect(
      isAssessmentAttemptRecord({
        version: 1,
        ...attemptInput(),
        extra: "not part of the persistence contract",
      }),
    ).toBe(false);
  });

  it("creates a deep-frozen snapshot that cannot be changed through the caller's response", () => {
    const input = attemptInput();
    const record = createAttemptRecord(input);
    input.response.next = "B";

    expect(record.response).toEqual({ next: "A" });
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.response)).toBe(true);
    expect(Object.isFrozen(record.rubric[0])).toBe(true);
  });
});
