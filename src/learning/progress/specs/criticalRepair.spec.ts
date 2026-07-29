import { describe, expect, it } from "vitest";

import {
  createCriticalRepairSubmission,
  type CriticalRepairSubmissionInput,
} from "../criticalRepair";
import { createMasteryScope, evaluateMastery, getUnresolvedCriticalFailures } from "../grading";
import { createReviewedAttempt } from "../review";
import { createAttemptRecord } from "../types";

const failedAttempt = createAttemptRecord({
  itemId: "determinism-triage",
  mode: "scenario",
  variant: "platform-and-release-change",
  response: { decision: "A seed is sufficient." },
  gradingStatus: "graded",
  score: 1 / 3,
  rubric: [
    { id: "evidence-boundary", score: 0, maxScore: 2 },
    { id: "controlled-replay", score: 1, maxScore: 1 },
  ],
  criticalFailures: ["evidence-boundary"],
  confidence: 3,
  misconceptionCodes: [],
  repairedMisconceptionCodes: [],
  isomorphicRetest: false,
  changedContext: false,
  invariantEvidence: "",
  tradeoffEvidence: "",
  createdAt: 100,
  updatedAt: 200,
});

const repairOptions = {
  itemId: "determinism-triage",
  attempts: [failedAttempt],
  changedCaseId: "missing-boundaries",
  evidence: "For this changed record, replay requires the missing seed and platform fingerprint.",
  confidence: 4 as const,
  tradeoffEvidence: "Capturing both fields adds metadata but makes the claim auditable.",
  rubric: [
    { id: "evidence-boundary", score: 0, maxScore: 2 },
    { id: "controlled-replay", score: 0, maxScore: 1 },
  ],
} satisfies CriticalRepairSubmissionInput;

describe("critical-failure repair", () => {
  it("creates a pending, changed-context retest tied to an authored case", () => {
    expect(createCriticalRepairSubmission(repairOptions)).toEqual({
      mode: "scenario",
      variant: "repair-missing-boundaries",
      response: {
        repairCase: {
          id: "missing-boundaries",
          label: "Missing seed and platform",
          input: {
            dependency_lock: "sha256:lock",
            deterministic_algorithms: true,
            input_digest: "sha256:data",
          },
          expected: ["seed", "platform"],
          comparison: "deep-equal",
        },
        changedContextEvidence:
          "For this changed record, replay requires the missing seed and platform fingerprint.",
      },
      gradingStatus: "pending",
      score: 0,
      rubric: repairOptions.rubric,
      criticalFailures: [],
      confidence: 4,
      misconceptionCodes: [],
      repairedMisconceptionCodes: ["evidence-boundary"],
      isomorphicRetest: true,
      changedContext: true,
      invariantEvidence:
        "For this changed record, replay requires the missing seed and platform fingerprint.",
      tradeoffEvidence: "Capturing both fields adds metadata but makes the claim auditable.",
    });
  });

  it("clears the unresolved failure only after the repair receives a passing review", () => {
    const pendingSubmission = createCriticalRepairSubmission(repairOptions);
    const pendingRepair = createAttemptRecord({
      ...pendingSubmission,
      itemId: "determinism-triage",
      createdAt: 300,
      updatedAt: 300,
    });
    const reviewedRepair = createReviewedAttempt({
      attempt: pendingRepair,
      criteria: [
        { id: "evidence-boundary", label: "Evidence boundary", points: 2, critical: true },
        { id: "controlled-replay", label: "Controlled replay", points: 1 },
      ],
      metCriteria: ["evidence-boundary", "controlled-replay"],
      updatedAt: 400,
    });
    const scope = createMasteryScope({
      targetId: "determinism-triage",
      itemIds: ["determinism-triage"],
    });

    expect(getUnresolvedCriticalFailures([failedAttempt, pendingRepair], scope)).toEqual([
      "evidence-boundary",
    ]);
    expect(getUnresolvedCriticalFailures([failedAttempt, reviewedRepair], scope)).toEqual([]);
    expect(
      evaluateMastery([failedAttempt, reviewedRepair], scope).unresolvedCriticalFailures,
    ).toEqual([]);
  });

  it("rejects invented, ambiguous, or incomplete changed-context repairs", () => {
    expect(() => createCriticalRepairSubmission({ ...repairOptions, attempts: [] })).toThrow(
      /unresolved/i,
    );
    expect(() => createCriticalRepairSubmission({ ...repairOptions, evidence: "   " })).toThrow(
      /evidence/i,
    );
    expect(() =>
      createCriticalRepairSubmission({
        ...repairOptions,
        changedCaseId: "invented-case",
      }),
    ).toThrow(/canonical authored execution spec/i);
    expect(() =>
      createCriticalRepairSubmission({
        ...repairOptions,
        rubric: [{ id: "controlled-replay", score: 0, maxScore: 1 }],
      }),
    ).toThrow(/cover every unresolved/i);
    expect(() =>
      createCriticalRepairSubmission({
        ...repairOptions,
        attempts: [
          {
            ...failedAttempt,
            variant: "repair-missing-boundaries",
          },
        ],
      }),
    ).toThrow(/different authored case/i);
  });

  it("does not permit a second repair while an unresolved repair awaits review", () => {
    const pendingSubmission = createCriticalRepairSubmission(repairOptions);
    const pendingRepair = createAttemptRecord({
      ...pendingSubmission,
      itemId: "determinism-triage",
      createdAt: 300,
      updatedAt: 300,
    });

    expect(() =>
      createCriticalRepairSubmission({
        ...repairOptions,
        attempts: [failedAttempt, pendingRepair],
        changedCaseId: "complete-record",
      }),
    ).toThrow(/awaits review/i);
  });

  it("keeps an ordinary pending response separate from repair semantics", () => {
    const ordinaryPending = createAttemptRecord({
      ...failedAttempt,
      variant: "new-static-response",
      gradingStatus: "pending",
      score: 0,
      rubric: failedAttempt.rubric.map((dimension) => ({
        ...dimension,
        score: 0,
      })) as unknown as typeof failedAttempt.rubric,
      criticalFailures: [],
      createdAt: 300,
      updatedAt: 300,
    });
    const scope = createMasteryScope({
      targetId: "determinism-triage",
      itemIds: ["determinism-triage"],
    });

    expect(getUnresolvedCriticalFailures([failedAttempt, ordinaryPending], scope)).toEqual([
      "evidence-boundary",
    ]);
    expect(() =>
      createCriticalRepairSubmission({
        ...repairOptions,
        attempts: [failedAttempt, ordinaryPending],
      }),
    ).toThrow(/awaits review/i);
  });
});
