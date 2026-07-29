import { describe, expect, it } from "vitest";

import {
  MAX_ATTEMPT_RESPONSE_BYTES,
  MAX_ATTEMPT_STRING_LENGTH,
  createAttemptRecord,
  isAssessmentAttemptRecord,
} from "../types";

const attemptInput = () => ({
  itemId: "queue-trace",
  mode: "trace" as const,
  variant: "default",
  response: { next: "A" },
  gradingStatus: "graded" as const,
  score: 0.9,
  rubric: [{ id: "prediction", score: 0.9, maxScore: 1 }] as const,
  criticalFailures: [],
  confidence: 4 as const,
  misconceptionCodes: [],
  repairedMisconceptionCodes: [],
  isomorphicRetest: false,
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

  it("measures the serialized response bound in UTF-8 bytes", () => {
    const utf8HeavyResponse = Object.fromEntries(
      Array.from({ length: 8 }, (_, index) => [`part-${index}`, "é".repeat(8_000)]),
    );
    expect(JSON.stringify(utf8HeavyResponse).length).toBeLessThan(MAX_ATTEMPT_RESPONSE_BYTES);
    expect(() =>
      createAttemptRecord({ ...attemptInput(), response: utf8HeavyResponse } as never),
    ).toThrow(/progress contract/i);
  });

  it("measures individual response, evidence, and rubric strings in UTF-8 bytes", () => {
    const utf8OverBound = "é".repeat(MAX_ATTEMPT_STRING_LENGTH / 2 + 1);
    expect(utf8OverBound.length).toBeLessThan(MAX_ATTEMPT_STRING_LENGTH);

    expect(() =>
      createAttemptRecord({
        ...attemptInput(),
        response: { explanation: utf8OverBound },
      }),
    ).toThrow(/progress contract/i);
    expect(() =>
      createAttemptRecord({
        ...attemptInput(),
        invariantEvidence: utf8OverBound,
      }),
    ).toThrow(/progress contract/i);
    expect(() =>
      createAttemptRecord({
        ...attemptInput(),
        tradeoffEvidence: utf8OverBound,
      }),
    ).toThrow(/progress contract/i);
    expect(() =>
      createAttemptRecord({
        ...attemptInput(),
        rubric: [{ id: "reasoning", score: 1, maxScore: 1, feedback: utf8OverBound }],
      }),
    ).toThrow(/progress contract/i);
  });

  it("rejects cyclic and excessively deep responses without overflowing", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let depth = 0; depth < 40; depth += 1) {
      const nested: Record<string, unknown> = {};
      cursor.next = nested;
      cursor = nested;
    }

    expect(() => createAttemptRecord({ ...attemptInput(), response: cyclic } as never)).toThrow(
      /progress contract/i,
    );
    expect(() => createAttemptRecord({ ...attemptInput(), response: deep } as never)).toThrow(
      /progress contract/i,
    );
  });
});
