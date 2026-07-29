import type { AssessmentAttemptRecord } from "./types";

const DAY_MS = 86_400_000;
const ITEM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TARGET_ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const MAX_SCOPE_ITEMS = 128;

export interface MasteryPolicy {
  readonly passingThreshold: number;
  readonly minimumDistinctModes: number;
  readonly delayedRetrievalDays: readonly [number, number, number];
}

export interface MasteryScope {
  readonly targetId: string;
  readonly itemIds: readonly [string, ...string[]];
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
  readonly hasRequiredEvidence: boolean;
  readonly delayedRetrievalCompleted: boolean;
  readonly unresolvedCriticalFailures: readonly string[];
}

export interface NextRetrieval {
  readonly dueAt: number;
  readonly intervalDays: number;
}

export function createMasteryScope(scope: MasteryScope): MasteryScope {
  if (
    !TARGET_ID_PATTERN.test(scope.targetId) ||
    !Array.isArray(scope.itemIds) ||
    scope.itemIds.length === 0 ||
    scope.itemIds.length > MAX_SCOPE_ITEMS ||
    !scope.itemIds.every((itemId) => ITEM_ID_PATTERN.test(itemId)) ||
    new Set(scope.itemIds).size !== scope.itemIds.length
  ) {
    throw new Error("Mastery scope requires a canonical target and unique canonical item IDs.");
  }
  return Object.freeze({
    targetId: scope.targetId,
    itemIds: Object.freeze([...scope.itemIds]) as MasteryScope["itemIds"],
  });
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
  scope: MasteryScope,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): MasteryResult {
  const inScope = attemptsInScope(attempts, scope);
  const passing = inScope.filter((attempt) => isSuccessful(attempt, policy));
  const passingModes = [...new Set(passing.map((attempt) => attempt.mode))];
  const unresolvedCriticalFailures = getUnresolvedCriticalFailures(inScope, scope, policy);
  const initialCreatedAt = earliestCreatedAt(inScope);
  const scheduledDueDates =
    initialCreatedAt === undefined
      ? []
      : policy.delayedRetrievalDays.map((days) => initialCreatedAt + days * DAY_MS);
  const delayedRetrievalCompleted = passing.some(
    (attempt) =>
      attempt.delayedRetrievalDueAt !== undefined &&
      scheduledDueDates.includes(attempt.delayedRetrievalDueAt) &&
      isCompletedRetrieval(attempt, attempt.delayedRetrievalDueAt),
  );
  const hasInvariantEvidence = passing.some(
    (attempt) => attempt.invariantEvidence.trim().length > 0,
  );
  const hasTradeoffEvidence = passing.some((attempt) => attempt.tradeoffEvidence.trim().length > 0);
  const hasRequiredEvidence = hasInvariantEvidence || hasTradeoffEvidence;
  const changedContextSucceeded = passing.some((attempt) => attempt.changedContext);
  return {
    mastered:
      passingModes.length >= policy.minimumDistinctModes &&
      changedContextSucceeded &&
      hasRequiredEvidence &&
      delayedRetrievalCompleted &&
      unresolvedCriticalFailures.length === 0,
    passingModes,
    changedContextSucceeded,
    hasInvariantEvidence,
    hasTradeoffEvidence,
    hasRequiredEvidence,
    delayedRetrievalCompleted,
    unresolvedCriticalFailures,
  };
}

export function getUnresolvedCriticalFailures(
  attempts: readonly AssessmentAttemptRecord[],
  scope: MasteryScope,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): readonly string[] {
  const unresolved = new Map<string, CriticalFailure>();
  for (const attempt of sortedAttempts(attemptsInScope(attempts, scope))) {
    for (const code of attempt.criticalFailures) {
      unresolved.set(failureKey(attempt.itemId, code), {
        code,
        itemId: attempt.itemId,
        variant: attempt.variant,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
      });
    }
    if (!isSuccessful(attempt, policy) || !attempt.changedContext || !attempt.isomorphicRetest) {
      continue;
    }
    for (const repaired of attempt.repairedMisconceptionCodes) {
      const key = failureKey(attempt.itemId, repaired);
      const failure = unresolved.get(key);
      if (failure && attempt.variant !== failure.variant && isAfter(attempt, failure)) {
        unresolved.delete(key);
      }
    }
  }
  return [...unresolved.values()].map((failure) => failure.code);
}

export function nextRetrieval(
  attempts: readonly AssessmentAttemptRecord[],
  scope: MasteryScope,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): NextRetrieval | undefined {
  const inScope = attemptsInScope(attempts, scope);
  const initialCreatedAt = earliestCreatedAt(inScope);
  if (initialCreatedAt === undefined) return undefined;
  for (const intervalDays of policy.delayedRetrievalDays) {
    const dueAt = initialCreatedAt + intervalDays * DAY_MS;
    const completed = inScope.some(
      (attempt) =>
        isSuccessful(attempt, policy) &&
        attempt.delayedRetrievalDueAt === dueAt &&
        isCompletedRetrieval(attempt, dueAt),
    );
    if (!completed) return { dueAt, intervalDays };
  }
  return undefined;
}

interface CriticalFailure {
  readonly code: string;
  readonly itemId: string;
  readonly variant: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

function attemptsInScope(
  attempts: readonly AssessmentAttemptRecord[],
  scope: MasteryScope,
): readonly AssessmentAttemptRecord[] {
  const validScope = createMasteryScope(scope);
  const itemIds = new Set(validScope.itemIds);
  return attempts.filter((attempt) => itemIds.has(attempt.itemId));
}

function isSuccessful(attempt: AssessmentAttemptRecord, policy: MasteryPolicy): boolean {
  return (
    attempt.gradingStatus === "graded" &&
    attempt.score >= policy.passingThreshold &&
    attempt.criticalFailures.length === 0
  );
}

function isCompletedRetrieval(attempt: AssessmentAttemptRecord, dueAt: number): boolean {
  return (
    attempt.delayedRetrievalCompletedAt !== undefined &&
    attempt.delayedRetrievalCompletedAt >= dueAt &&
    attempt.createdAt >= dueAt &&
    attempt.updatedAt >= dueAt
  );
}

function failureKey(itemId: string, code: string): string {
  return `${itemId}:${code}`;
}

function isAfter(attempt: AssessmentAttemptRecord, failure: CriticalFailure): boolean {
  return (
    attempt.createdAt > failure.createdAt ||
    (attempt.createdAt === failure.createdAt && attempt.updatedAt > failure.updatedAt)
  );
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
