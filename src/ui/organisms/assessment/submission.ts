import type { AssessmentVariantMetadata } from "../../../learning/assessment";
import type {
  AssessmentAttemptMode,
  AssessmentGradingStatus,
  AssessmentSubmission,
  AssessmentSubmissionContext,
  JsonValue,
  RubricDimensionResult,
} from "../../../learning/progress/types";

interface SubmissionOptions {
  readonly mode: AssessmentAttemptMode;
  readonly metadata: AssessmentVariantMetadata;
  readonly context: AssessmentSubmissionContext;
  readonly response: JsonValue;
  readonly gradingStatus: AssessmentGradingStatus;
  readonly score: number;
  readonly rubric: readonly [RubricDimensionResult, ...RubricDimensionResult[]];
}

export function createAssessmentSubmission({
  mode,
  metadata,
  context,
  response,
  gradingStatus,
  score,
  rubric,
}: SubmissionOptions): AssessmentSubmission {
  return {
    mode,
    variant: metadata.variant,
    response,
    gradingStatus,
    score,
    rubric,
    criticalFailures: [],
    confidence: context.confidence,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    isomorphicRetest: metadata.isomorphicRetest,
    changedContext: metadata.changedContext,
    invariantEvidence: context.invariantEvidence,
    tradeoffEvidence: context.tradeoffEvidence,
    delayedRetrievalDueAt: metadata.delayedRetrievalDueAt,
  };
}

export function pendingRubric(
  id: string,
): readonly [RubricDimensionResult, ...RubricDimensionResult[]] {
  return [{ id, score: 0, maxScore: 1, feedback: "Pending review." }];
}

export function pendingRubricFromCriteria(
  criteria: readonly [
    { readonly id: string; readonly points: number },
    ...{
      readonly id: string;
      readonly points: number;
    }[],
  ],
): readonly [RubricDimensionResult, ...RubricDimensionResult[]] {
  return criteria.map((criterion) => ({
    id: criterion.id,
    score: 0,
    maxScore: criterion.points,
    feedback: "Pending review.",
  })) as [RubricDimensionResult, ...RubricDimensionResult[]];
}
