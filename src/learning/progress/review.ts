import { createAttemptRecord, type AssessmentAttemptRecord } from "./types";

export interface AttemptReviewCriterion {
  readonly id: string;
  readonly label: string;
  readonly points: number;
  readonly critical?: boolean;
}

export interface ReviewedAttemptInput {
  readonly attempt: AssessmentAttemptRecord;
  readonly criteria: readonly [AttemptReviewCriterion, ...AttemptReviewCriterion[]];
  readonly metCriteria: readonly string[];
  readonly updatedAt: number;
}

export function createReviewedAttempt({
  attempt,
  criteria,
  metCriteria,
  updatedAt,
}: ReviewedAttemptInput): AssessmentAttemptRecord {
  const pendingIds = new Set(attempt.rubric.map(({ id }) => id));
  const criterionIds = new Set(criteria.map(({ id }) => id));
  if (
    attempt.gradingStatus !== "pending" ||
    pendingIds.size !== criterionIds.size ||
    [...pendingIds].some((id) => !criterionIds.has(id))
  ) {
    throw new Error("Self-review criteria must match the pending attempt rubric.");
  }
  if (
    !Number.isFinite(updatedAt) ||
    updatedAt < attempt.updatedAt ||
    criteria.some(({ points }) => !Number.isFinite(points) || points <= 0) ||
    metCriteria.some((id) => !criterionIds.has(id)) ||
    new Set(metCriteria).size !== metCriteria.length
  ) {
    throw new Error("Self-review requires valid criterion selections and a monotonic timestamp.");
  }

  const met = new Set(metCriteria);
  const rubric = criteria.map((criterion) => ({
    id: criterion.id,
    score: met.has(criterion.id) ? criterion.points : 0,
    maxScore: criterion.points,
    feedback: met.has(criterion.id)
      ? "Criterion explicitly confirmed during self-review."
      : "Criterion not yet demonstrated during self-review.",
  })) as unknown as AssessmentAttemptRecord["rubric"];
  const earned = rubric.reduce((total, result) => total + result.score, 0);
  const available = rubric.reduce((total, result) => total + result.maxScore, 0);

  return createAttemptRecord({
    ...attempt,
    gradingStatus: "graded",
    score: earned / available,
    rubric,
    criticalFailures: [
      ...new Set([
        ...attempt.criticalFailures,
        ...criteria
          .filter((criterion) => criterion.critical && !met.has(criterion.id))
          .map(({ id }) => id),
      ]),
    ],
    updatedAt,
  });
}
