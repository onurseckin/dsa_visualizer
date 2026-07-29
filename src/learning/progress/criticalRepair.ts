import { getLearningItem } from "../registry";
import { getLearningItemPlayground } from "../types";
import { createMasteryScope, getUnresolvedCriticalFailures } from "./grading";
import type { AssessmentAttemptRecord, AssessmentSubmission, RubricDimensionResult } from "./types";

const CANONICAL_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_VARIANT_LENGTH = 96;

export interface CriticalRepairSubmissionInput {
  readonly itemId: string;
  readonly attempts: readonly AssessmentAttemptRecord[];
  readonly changedCaseId: string;
  readonly evidence: string;
  readonly confidence: AssessmentAttemptRecord["confidence"];
  readonly tradeoffEvidence: string;
  readonly rubric: readonly [RubricDimensionResult, ...RubricDimensionResult[]];
}

/**
 * Creates the only assessment submission that may claim repair semantics.
 * The selected authored case supplies a concrete, inspectable context and the
 * resulting variant must differ from every still-unresolved failure variant.
 */
export function createCriticalRepairSubmission({
  itemId,
  attempts,
  changedCaseId,
  evidence,
  confidence,
  tradeoffEvidence,
  rubric,
}: CriticalRepairSubmissionInput): AssessmentSubmission {
  const canonicalEvidence = evidence.trim();
  if (!CANONICAL_CODE.test(itemId)) {
    throw new Error("Critical repair requires a canonical item ID.");
  }
  const item = getLearningItem(itemId);
  const playground = item ? getLearningItemPlayground(item) : undefined;
  const changedCase = playground?.execution.cases.find((testCase) => testCase.id === changedCaseId);
  if (!item || !changedCase) {
    throw new Error("Critical repair requires a case from the canonical authored execution spec.");
  }
  if (!canonicalEvidence) {
    throw new Error("Critical repair requires changed-context evidence.");
  }

  const itemAttempts = attempts.filter((attempt) => attempt.itemId === itemId);
  const scope = createMasteryScope({ targetId: itemId, itemIds: [itemId] });
  const unresolved = getUnresolvedCriticalFailures(itemAttempts, scope);
  if (unresolved.length === 0) {
    throw new Error("Critical repair requires an unresolved critical failure.");
  }
  if (itemAttempts.some((attempt) => attempt.gradingStatus === "pending")) {
    throw new Error("An assessment attempt already awaits review.");
  }

  const variant = `repair-${changedCase.id}`;
  const unresolvedSet = new Set(unresolved);
  const failureVariants = new Set(
    itemAttempts
      .filter((attempt) => attempt.criticalFailures.some((failure) => unresolvedSet.has(failure)))
      .map((attempt) => attempt.variant),
  );
  if (variant.length > MAX_VARIANT_LENGTH || failureVariants.has(variant)) {
    throw new Error("Critical repair requires a different authored case and canonical variant.");
  }
  if (
    rubric.length === 0 ||
    rubric.some(
      ({ id, score, maxScore }) =>
        !CANONICAL_CODE.test(id) || score !== 0 || !Number.isFinite(maxScore) || maxScore <= 0,
    ) ||
    new Set(rubric.map(({ id }) => id)).size !== rubric.length
  ) {
    throw new Error("Critical repair requires a valid pending review rubric.");
  }
  const rubricIds = new Set(rubric.map(({ id }) => id));
  if (unresolved.some((failure) => !rubricIds.has(failure))) {
    throw new Error("Critical repair rubric must cover every unresolved critical failure.");
  }

  return {
    mode: item.kind,
    variant,
    response: {
      repairCase: {
        id: changedCase.id,
        label: changedCase.label,
        input: changedCase.input,
        expected: changedCase.expected,
        comparison: changedCase.comparison,
        ...(changedCase.tolerance === undefined ? {} : { tolerance: changedCase.tolerance }),
      },
      changedContextEvidence: canonicalEvidence,
    },
    gradingStatus: "pending",
    score: 0,
    rubric,
    criticalFailures: [],
    confidence,
    misconceptionCodes: [],
    repairedMisconceptionCodes: unresolved,
    isomorphicRetest: true,
    changedContext: true,
    invariantEvidence: canonicalEvidence,
    tradeoffEvidence: tradeoffEvidence.trim(),
  };
}
