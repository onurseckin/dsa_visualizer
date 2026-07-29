import { useState } from "react";

import { createCriticalRepairSubmission } from "../../../learning/progress/criticalRepair";
import {
  createMasteryScope,
  getUnresolvedCriticalFailures,
} from "../../../learning/progress/grading";
import type {
  AssessmentAttemptRecord,
  AssessmentSubmissionContext,
  AssessmentSubmissionHandler,
  RubricDimensionResult,
} from "../../../learning/progress/types";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import type { DisplayReviewCriterion } from "./AttemptSelfReview";

interface AuthoredRepairCase {
  readonly id: string;
  readonly label: string;
  readonly input: unknown;
}

export interface CriticalRepairPanelProps {
  readonly itemId: string;
  readonly title: string;
  readonly attempts: readonly AssessmentAttemptRecord[];
  readonly cases: readonly AuthoredRepairCase[];
  readonly criteria: readonly [DisplayReviewCriterion, ...DisplayReviewCriterion[]];
  readonly submissionContext: AssessmentSubmissionContext;
  readonly onSubmit: AssessmentSubmissionHandler;
}

export function CriticalRepairPanel({
  itemId,
  title,
  attempts,
  cases,
  criteria,
  submissionContext,
  onSubmit,
}: CriticalRepairPanelProps): React.ReactElement {
  const scope = createMasteryScope({ targetId: itemId, itemIds: [itemId] });
  const unresolved = getUnresolvedCriticalFailures(attempts, scope);
  const unresolvedSet = new Set(unresolved);
  const failedVariants = new Set(
    attempts
      .filter(
        (attempt) =>
          attempt.itemId === itemId &&
          attempt.criticalFailures.some((failure) => unresolvedSet.has(failure)),
      )
      .map((attempt) => attempt.variant),
  );
  const availableCases = cases.filter((testCase) => !failedVariants.has(`repair-${testCase.id}`));
  const [selectedCaseId, setSelectedCaseId] = useState(availableCases[0]?.id ?? "");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState(
    "Choose a genuinely different authored case and explain how the invariant applies.",
  );
  const selectedCase =
    availableCases.find((testCase) => testCase.id === selectedCaseId) ?? availableCases[0];
  const pendingAttempt = attempts.find(
    (attempt) => attempt.itemId === itemId && attempt.gradingStatus === "pending",
  );
  const repairAwaitsReview = pendingAttempt !== undefined;
  const pendingIsRepair = pendingAttempt?.repairedMisconceptionCodes.some((code) =>
    unresolvedSet.has(code),
  );

  const submitRepair = () => {
    if (!selectedCase) {
      setMessage("No distinct authored case is available for this repair.");
      return;
    }
    try {
      const [firstCriterion, ...remainingCriteria] = criteria;
      const pendingResult = (criterion: DisplayReviewCriterion): RubricDimensionResult => ({
        id: criterion.id,
        score: 0,
        maxScore: criterion.points,
        feedback: "Pending changed-context review.",
      });
      const rubric: [RubricDimensionResult, ...RubricDimensionResult[]] = [
        pendingResult(firstCriterion),
        ...remainingCriteria.map(pendingResult),
      ];
      const submission = createCriticalRepairSubmission({
        itemId,
        attempts,
        changedCaseId: selectedCase.id,
        evidence,
        confidence: submissionContext.confidence,
        tradeoffEvidence: submissionContext.tradeoffEvidence,
        rubric,
      });
      const saved = onSubmit(submission);
      setMessage(
        saved
          ? "Changed-context repair saved. Complete its self-review before it can resolve a failure."
          : "The changed-context repair could not be saved.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The repair could not be created.");
    }
  };

  return (
    <section className="assessment-critical-repair" aria-label={`${title} critical repair`}>
      <div>
        <p>Critical repair required</p>
        <h2>Re-apply the invariant in a changed context</h2>
      </div>
      <p>
        A new static response is not enough. Use a different authored execution case and produce
        fresh evidence before reviewing the repair.
      </p>
      <Well padding="sm">
        <strong>Unresolved critical failures</strong>
        <ul className="assessment-critical-repair__failures">
          {unresolved.map((failure) => (
            <li key={failure}>
              <code>{failure}</code>
            </li>
          ))}
        </ul>
      </Well>
      {availableCases.length > 0 ? (
        <>
          <label className="assessment-field">
            <span>Changed-context case</span>
            <select
              aria-label="Changed-context case"
              value={selectedCase?.id ?? ""}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              disabled={repairAwaitsReview}
            >
              {availableCases.map((testCase) => (
                <option key={testCase.id} value={testCase.id}>
                  {testCase.label}
                </option>
              ))}
            </select>
          </label>
          {selectedCase ? (
            <Well padding="sm" className="assessment-critical-repair__case">
              <strong>Authored case input</strong>
              <pre>{JSON.stringify(selectedCase.input, null, 2)}</pre>
            </Well>
          ) : null}
          <label className="assessment-field">
            <span>Changed-context repair evidence</span>
            <textarea
              aria-label="Changed-context repair evidence"
              value={evidence}
              disabled={repairAwaitsReview}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="State the result you expect for this input and explain the invariant that produces it."
            />
          </label>
          <Button variant="primary" disabled={repairAwaitsReview} onClick={submitRepair}>
            Submit changed-context repair
          </Button>
        </>
      ) : (
        <p role="alert">
          No distinct authored execution case remains. This item cannot claim a changed-context
          repair until another case is authored.
        </p>
      )}
      <p
        className="assessment-status"
        role={
          message.includes("requires") ||
          message.includes("could not") ||
          message.includes("No distinct")
            ? "alert"
            : "status"
        }
        aria-live="polite"
      >
        {repairAwaitsReview
          ? pendingIsRepair
            ? "The changed-context repair awaits self-review."
            : "Finish the existing self-review first; it has not been relabeled as a repair."
          : message}
      </p>
    </section>
  );
}
