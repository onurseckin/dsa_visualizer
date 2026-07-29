import type { AssessmentAttemptRecord } from "./types";

const DAY_MS = 86_400_000;

export interface MasteryPolicy {
  readonly passingThreshold: number;
  readonly minimumDistinctModes: number;
  readonly delayedRetrievalDays: readonly [number, number, number];
}

export const DEFAULT_MASTERY_POLICY: MasteryPolicy = Object.freeze({
  passingThreshold: 0.8,
  minimumDistinctModes: 2,
  delayedRetrievalDays: [1, 7, 24] as [number, number, number],
});

export interface MasteryResult {
  readonly mastered: boolean;
  readonly passingModes: readonly AssessmentAttemptRecord["mode"][];
  readonly changedContextSucceeded: boolean;
  readonly hasInvariantEvidence: boolean;
  readonly hasTradeoffEvidence: boolean;
  readonly delayedRetrievalCompleted: boolean;
  readonly unresolvedCriticalFailures: readonly string[];
}

export interface NextRetrieval {
  readonly dueAt: number;
  readonly intervalDays: number;
}

export function createMasteryPolicy(options: Partial<MasteryPolicy> = {}): MasteryPolicy {
  const threshold = options.passingThreshold ?? DEFAULT_MASTERY_POLICY.passingThreshold;
  const modes = options.minimumDistinctModes ?? DEFAULT_MASTERY_POLICY.minimumDistinctModes;
  const schedule = options.delayedRetrievalDays ?? DEFAULT_MASTERY_POLICY.delayedRetrievalDays;
  if (
    !Number.isFinite(threshold) ||
    threshold < 0.8 ||
    threshold > 0.85 ||
    !Number.isInteger(modes) ||
    modes < 2 ||
    schedule.length !== 3 ||
    schedule[0] !== 1 ||
    schedule[1] !== 7 ||
    schedule[2] < 21 ||
    schedule[2] > 28
  ) {
    throw new Error("Mastery policy must use an 80–85% threshold and a 1/7/21–28 day schedule.");
  }
  return Object.freeze({
    passingThreshold: threshold,
    minimumDistinctModes: modes,
    delayedRetrievalDays: [...schedule] as MasteryPolicy["delayedRetrievalDays"],
  });
}

export function evaluateMastery(
  attempts: readonly AssessmentAttemptRecord[],
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): MasteryResult {
  const passing = attempts.filter((attempt) => isSuccessful(attempt, policy));
  const passingModes = [...new Set(passing.map((attempt) => attempt.mode))];
  const unresolvedCriticalFailures = getUnresolvedCriticalFailures(attempts, policy);
  const initialCreatedAt = earliestCreatedAt(attempts);
  const delayedRetrievalCompleted =
    initialCreatedAt !== undefined &&
    passing.some(
      (attempt) =>
        attempt.delayedRetrievalDueAt !== undefined &&
        attempt.delayedRetrievalCompletedAt !== undefined &&
        attempt.delayedRetrievalCompletedAt >= attempt.delayedRetrievalDueAt &&
        attempt.delayedRetrievalDueAt > initialCreatedAt,
    );
  const hasInvariantEvidence = passing.some(
    (attempt) => attempt.invariantEvidence.trim().length > 0,
  );
  const hasTradeoffEvidence = passing.some((attempt) => attempt.tradeoffEvidence.trim().length > 0);
  const changedContextSucceeded = passing.some((attempt) => attempt.changedContext);
  return {
    mastered:
      passingModes.length >= policy.minimumDistinctModes &&
      changedContextSucceeded &&
      hasInvariantEvidence &&
      hasTradeoffEvidence &&
      delayedRetrievalCompleted &&
      unresolvedCriticalFailures.length === 0,
    passingModes,
    changedContextSucceeded,
    hasInvariantEvidence,
    hasTradeoffEvidence,
    delayedRetrievalCompleted,
    unresolvedCriticalFailures,
  };
}

export function getUnresolvedCriticalFailures(
  attempts: readonly AssessmentAttemptRecord[],
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): readonly string[] {
  const unresolved = new Set<string>();
  for (const attempt of sortedAttempts(attempts)) {
    for (const criticalFailure of attempt.criticalFailures) unresolved.add(criticalFailure);
    if (isSuccessful(attempt, policy)) {
      for (const repaired of attempt.repairedMisconceptionCodes) unresolved.delete(repaired);
    }
  }
  return [...unresolved];
}

export function nextRetrieval(
  attempts: readonly AssessmentAttemptRecord[],
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): NextRetrieval | undefined {
  const initialCreatedAt = earliestCreatedAt(attempts);
  if (initialCreatedAt === undefined) return undefined;
  for (const intervalDays of policy.delayedRetrievalDays) {
    const dueAt = initialCreatedAt + intervalDays * DAY_MS;
    const completed = attempts.some(
      (attempt) =>
        isSuccessful(attempt, policy) &&
        attempt.delayedRetrievalDueAt === dueAt &&
        attempt.delayedRetrievalCompletedAt !== undefined &&
        attempt.delayedRetrievalCompletedAt >= dueAt,
    );
    if (!completed) return { dueAt, intervalDays };
  }
  return undefined;
}

function isSuccessful(attempt: AssessmentAttemptRecord, policy: MasteryPolicy): boolean {
  return attempt.score >= policy.passingThreshold && attempt.criticalFailures.length === 0;
}

function earliestCreatedAt(attempts: readonly AssessmentAttemptRecord[]): number | undefined {
  return attempts.reduce<number | undefined>(
    (earliest, attempt) =>
      earliest === undefined || attempt.createdAt < earliest ? attempt.createdAt : earliest,
    undefined,
  );
}

function sortedAttempts(
  attempts: readonly AssessmentAttemptRecord[],
): readonly AssessmentAttemptRecord[] {
  return [...attempts].sort(
    (left, right) => left.createdAt - right.createdAt || left.updatedAt - right.updatedAt,
  );
}
