import { useState } from "react";

import {
  getUnresolvedCriticalFailures,
  nextRetrieval,
  retrievalWindowForAttempt,
} from "../../../learning/progress/grading";
import {
  createReviewedAttempt,
  type AttemptReviewCriterion,
} from "../../../learning/progress/review";
import { assessmentAttemptStorage, type AttemptStorage } from "../../../learning/progress/storage";
import {
  createAttemptRecord,
  type AssessmentAttemptRecord,
  type AssessmentSubmission,
  type AssessmentSubmissionContext,
  type JsonValue,
} from "../../../learning/progress/types";
import type { LearningItem } from "../../../learning/types";
import {
  getLearningItemPlayground,
  isAlgorithmLearningItem,
  isCodeLearningItem,
  isRubricLearningItem,
} from "../../../learning/types";
import { CodeWorkspace } from "../code-workspace/CodeWorkspace";
import { AssessmentVisualization } from "./AssessmentVisualization";
import {
  AttemptSelfReview,
  type AuthoredReviewReference,
  type DisplayReviewCriterion,
} from "./AttemptSelfReview";
import { CalculatorAssessment } from "./CalculatorAssessment";
import { CapstoneAssessment } from "./CapstoneAssessment";
import { CriticalRepairPanel } from "./CriticalRepairPanel";
import { DebuggingAssessment } from "./DebuggingAssessment";
import { ScenarioAssessment } from "./ScenarioAssessment";
import { TraceAssessment, Unavailable } from "./TraceAssessment";

export interface AssessmentWorkspaceProps {
  readonly item: LearningItem;
  readonly storage?: AttemptStorage;
  readonly now?: () => number;
}

/** Renders only authored assessment payloads; algorithm playback remains MainLayout-owned. */
export function AssessmentWorkspace(props: AssessmentWorkspaceProps): React.ReactElement {
  return <ItemAssessmentWorkspace key={props.item.id} {...props} />;
}

function ItemAssessmentWorkspace({
  item,
  storage = assessmentAttemptStorage,
  now = Date.now,
}: AssessmentWorkspaceProps): React.ReactElement {
  const playground = getLearningItemPlayground(item);
  const [confidence, setConfidence] = useState<AssessmentSubmissionContext["confidence"]>(3);
  const [invariantEvidence, setInvariantEvidence] = useState("");
  const [tradeoffEvidence, setTradeoffEvidence] = useState("");
  const [workspaceTimestamp, setWorkspaceTimestamp] = useState(now);
  const [savedCount, setSavedCount] = useState(
    () => storage.load().filter((attempt) => attempt.itemId === item.id).length,
  );
  const [pendingReview, setPendingReview] = useState<AssessmentAttemptRecord | undefined>(() =>
    latestPendingAttempt(storage.load(), item.id),
  );
  const [persistenceMessage, setPersistenceMessage] = useState("");
  const submissionContext: AssessmentSubmissionContext = {
    confidence,
    invariantEvidence,
    tradeoffEvidence,
  };
  const currentAttempts = storage.load().filter((attempt) => attempt.itemId === item.id);
  const masteryScope = { targetId: item.id, itemIds: [item.id] } as const;
  const unresolvedCriticalFailures = currentAttempts.length
    ? getUnresolvedCriticalFailures(currentAttempts, masteryScope)
    : [];
  const criticalFailureAttempt = [...currentAttempts]
    .reverse()
    .find((attempt) =>
      attempt.criticalFailures.some((failure) => unresolvedCriticalFailures.includes(failure)),
    );
  const retrieval = currentAttempts.length
    ? nextRetrieval(currentAttempts, masteryScope)
    : undefined;

  const submit = (submission: AssessmentSubmission): boolean => {
    try {
      const existingAttempts = storage.load().filter((attempt) => attempt.itemId === item.id);
      const timestamp = uniqueAttemptTimestamp(existingAttempts, now());
      const retrieval =
        submission.delayedRetrievalDueAt === undefined
          ? retrievalWindowForAttempt(existingAttempts, timestamp)
          : {
              dueAt: submission.delayedRetrievalDueAt,
              completedAt: timestamp >= submission.delayedRetrievalDueAt ? timestamp : undefined,
            };
      const record = createAttemptRecord({
        ...submission,
        itemId: item.id,
        delayedRetrievalDueAt: retrieval.dueAt,
        delayedRetrievalCompletedAt: retrieval.completedAt,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const saved = storage.save(record);
      if (saved) {
        setWorkspaceTimestamp(timestamp);
        setSavedCount(storage.load().filter((attempt) => attempt.itemId === item.id).length);
        if (record.gradingStatus === "pending") setPendingReview(record);
        setPersistenceMessage("Attempt saved locally.");
      } else {
        setPersistenceMessage("Attempt could not be saved locally.");
      }
      return saved;
    } catch {
      setPersistenceMessage("Attempt could not be saved locally.");
      return false;
    }
  };

  const review = (metCriteria: readonly string[]): boolean => {
    if (!pendingReview) return false;
    try {
      if (
        pendingReview.repairedMisconceptionCodes.length > 0 &&
        !canonicalRepairCase(item, pendingReview)
      ) {
        setPersistenceMessage("Reviewed grade could not be saved: repair provenance is invalid.");
        return false;
      }
      const timestamp = Math.max(now(), pendingReview.updatedAt);
      const reviewed = createReviewedAttempt({
        attempt: pendingReview,
        criteria: reviewCriteria(item, pendingReview),
        metCriteria,
        updatedAt: timestamp,
      });
      const saved = storage.update(reviewed);
      if (saved) {
        setWorkspaceTimestamp(timestamp);
        const currentAttempts = storage.load();
        setPendingReview(latestPendingAttempt(currentAttempts, item.id));
        setSavedCount(currentAttempts.filter((attempt) => attempt.itemId === item.id).length);
        setPersistenceMessage(`Reviewed grade saved (${Math.round(reviewed.score * 100)}%).`);
      } else {
        setPersistenceMessage("Reviewed grade could not be saved.");
      }
      return saved;
    } catch {
      setPersistenceMessage("Reviewed grade could not be saved.");
      return false;
    }
  };

  if (isAlgorithmLearningItem(item)) {
    return <Unavailable title={item.title} mode="algorithm" />;
  }

  let content: React.ReactNode;
  switch (item.kind) {
    case "trace":
      content = (
        <TraceAssessment
          title={item.title}
          payload={item.assessment.payload}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      );
      break;
    case "calculator":
      content = (
        <CalculatorAssessment
          title={item.title}
          payload={item.assessment.payload}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      );
      break;
    case "debugging":
      content = (
        <DebuggingAssessment
          title={item.title}
          payload={item.assessment.payload}
          correctedReference={item.code}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      );
      break;
    case "scenario":
      content = (
        <ScenarioAssessment
          title={item.title}
          prompt={item.prompt}
          payload={item.assessment.payload}
          rubric={item.rubric}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      );
      break;
    case "capstone":
      content = (
        <CapstoneAssessment
          title={item.title}
          prompt={item.prompt}
          payload={item.assessment.payload}
          rubric={item.rubric}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      );
      break;
  }

  return (
    <main className="assessment-workspace" aria-label={`${item.title} assessment`}>
      <header className="assessment-workspace__header">
        <p>Assessment workspace</p>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </header>
      <section className="assessment-context" aria-label="Attempt context">
        <label className="assessment-field">
          <span>Confidence</span>
          <select
            aria-label="Confidence"
            value={confidence}
            onChange={(event) =>
              setConfidence(Number(event.target.value) as AssessmentSubmissionContext["confidence"])
            }
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="assessment-field">
          <span>Governing invariant evidence</span>
          <textarea
            aria-label="Governing invariant evidence"
            value={invariantEvidence}
            onChange={(event) => setInvariantEvidence(event.target.value)}
          />
        </label>
        <label className="assessment-field">
          <span>Tradeoff evidence</span>
          <textarea
            aria-label="Tradeoff evidence"
            value={tradeoffEvidence}
            onChange={(event) => setTradeoffEvidence(event.target.value)}
          />
        </label>
        <p className="assessment-status" role="status" aria-live="polite">
          <span>
            {savedCount} saved {savedCount === 1 ? "attempt" : "attempts"}
          </span>
          {persistenceMessage ? ` · ${persistenceMessage}` : ""}
        </p>
        <p className="assessment-retrieval" aria-label="Retrieval schedule">
          <strong>Retrieval practice</strong> ·{" "}
          {retrievalStatus(currentAttempts, retrieval?.dueAt, workspaceTimestamp)}
        </p>
      </section>
      <div key={item.id}>{content}</div>
      {pendingReview ? (
        <AttemptSelfReview
          key={`${pendingReview.mode}-${pendingReview.variant}-${pendingReview.createdAt}`}
          title={item.title}
          attempt={pendingReview}
          criteria={reviewCriteria(item, pendingReview)}
          reference={authoredReviewReference(item, pendingReview)}
          onReview={review}
        />
      ) : null}
      {unresolvedCriticalFailures.length > 0 && criticalFailureAttempt ? (
        <CriticalRepairPanel
          key={`${criticalFailureAttempt.variant}-${criticalFailureAttempt.updatedAt}`}
          itemId={item.id}
          title={item.title}
          attempts={currentAttempts}
          cases={playground?.execution.cases ?? []}
          criteria={reviewCriteria(item, criticalFailureAttempt)}
          submissionContext={submissionContext}
          onSubmit={submit}
        />
      ) : null}
      {playground ? (
        <>
          <AssessmentVisualization title={item.title} playground={playground} />
          {isRubricLearningItem(item) ? (
            <p>This executable playground is separate from the rubric-scored response.</p>
          ) : null}
          <CodeWorkspace
            itemId={item.id}
            itemTitle={item.title}
            referenceCode={playground.code}
            starterCode={playground.starterCode}
            executionSpec={playground.execution}
          />
        </>
      ) : null}
    </main>
  );
}

function latestPendingAttempt(
  attempts: readonly AssessmentAttemptRecord[],
  itemId: string,
): AssessmentAttemptRecord | undefined {
  return [...attempts]
    .reverse()
    .find((attempt) => attempt.itemId === itemId && attempt.gradingStatus === "pending");
}

function reviewCriteria(
  item: LearningItem,
  attempt: AssessmentAttemptRecord,
): readonly [DisplayReviewCriterion, ...DisplayReviewCriterion[]] {
  const authoredCriteria = isRubricLearningItem(item)
    ? new Map(item.rubric.criteria.map((criterion) => [criterion.id, criterion]))
    : undefined;
  return attempt.rubric.map((dimension) => {
    const authored = authoredCriteria?.get(dimension.id);
    return {
      id: dimension.id,
      label: authored?.label ?? humanizeCriterionId(dimension.id),
      description:
        authored?.description ??
        "Confirm this criterion only after comparing your response with the authored reference.",
      points: authored?.points ?? dimension.maxScore,
      critical: authored?.critical,
    } satisfies DisplayReviewCriterion & AttemptReviewCriterion;
  }) as [DisplayReviewCriterion, ...DisplayReviewCriterion[]];
}

function authoredReviewReference(
  item: LearningItem,
  attempt: AssessmentAttemptRecord,
): AuthoredReviewReference | undefined {
  const repairCase = canonicalRepairCase(item, attempt);
  if (repairCase) {
    return {
      ariaLabel: "Authored changed-context repair reference",
      title: "Authored changed-context case and oracle",
      content: JSON.stringify(
        {
          input: repairCase.input,
          expected: repairCase.expected,
          comparison: repairCase.comparison,
          ...(repairCase.tolerance === undefined ? {} : { tolerance: repairCase.tolerance }),
        },
        null,
        2,
      ),
    };
  }

  if (attempt.mode === "trace" && item.kind === "trace") {
    const reference = item.assessment.payload?.referenceNextState;
    return reference
      ? {
          ariaLabel: "Authored trace reference",
          title: "Authored next state",
          content: reference,
        }
      : undefined;
  }

  if (
    (attempt.mode === "debugging" || attempt.mode === "code-completion") &&
    isCodeLearningItem(item)
  ) {
    return {
      ariaLabel:
        attempt.mode === "debugging" ? "Immutable corrected reference" : "Canonical code reference",
      title:
        attempt.mode === "debugging" ? "Immutable corrected reference" : "Canonical solution code",
      content: item.code,
    };
  }

  if ((attempt.mode === "scenario" || attempt.mode === "capstone") && isRubricLearningItem(item)) {
    const constraints = item.prompt.constraints?.length
      ? `\nConstraints:\n${item.prompt.constraints.map((constraint) => `- ${constraint}`).join("\n")}`
      : "";
    const rubric = item.rubric.criteria
      .map(
        (criterion) =>
          `- ${criterion.label} (${criterion.points} points${criterion.critical ? ", critical" : ""}): ${criterion.description}`,
      )
      .join("\n");
    return {
      ariaLabel: "Authored prompt and rubric reference",
      title: "Authored prompt and rubric",
      content: `${item.prompt.context}\n\n${item.prompt.question}${constraints}\n\nRubric:\n${rubric}`,
    };
  }

  return undefined;
}

function canonicalRepairCase(item: LearningItem, attempt: AssessmentAttemptRecord) {
  if (attempt.repairedMisconceptionCodes.length === 0 || !isJsonObject(attempt.response)) {
    return undefined;
  }
  const savedCase = attempt.response.repairCase;
  if (!isJsonObject(savedCase)) {
    return undefined;
  }
  const caseId = savedCase.id;
  if (typeof caseId !== "string" || attempt.variant !== `repair-${caseId}`) {
    return undefined;
  }
  const canonicalCase = getLearningItemPlayground(item)?.execution.cases.find(
    (testCase) => testCase.id === caseId,
  );
  if (!canonicalCase) return undefined;
  const savedEvidence = JSON.stringify({
    id: savedCase.id,
    label: savedCase.label,
    input: savedCase.input,
    expected: savedCase.expected,
    comparison: savedCase.comparison,
    ...(savedCase.tolerance === undefined ? {} : { tolerance: savedCase.tolerance }),
  });
  const canonicalEvidence = JSON.stringify({
    id: canonicalCase.id,
    label: canonicalCase.label,
    input: canonicalCase.input,
    expected: canonicalCase.expected,
    comparison: canonicalCase.comparison,
    ...(canonicalCase.tolerance === undefined ? {} : { tolerance: canonicalCase.tolerance }),
  });
  return savedEvidence === canonicalEvidence ? canonicalCase : undefined;
}

function isJsonObject(value: JsonValue): value is { readonly [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeCriterionId(id: string): string {
  return id
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function uniqueAttemptTimestamp(
  attempts: readonly AssessmentAttemptRecord[],
  requestedTimestamp: number,
): number {
  const latestCreatedAt = attempts.reduce(
    (latest, attempt) => Math.max(latest, attempt.createdAt),
    -1,
  );
  return Math.max(requestedTimestamp, latestCreatedAt + 1);
}

function retrievalStatus(
  attempts: readonly AssessmentAttemptRecord[],
  dueAt: number | undefined,
  timestamp: number,
): string {
  if (attempts.length === 0) {
    return "a 1-day retrieval will be scheduled after this attempt.";
  }
  if (dueAt === undefined) {
    return "all scheduled retrieval windows are complete.";
  }
  if (timestamp >= dueAt) {
    return "due now. Re-attempt this assessment and complete its self-review to record it.";
  }
  return `next retrieval is scheduled for ${new Date(dueAt).toLocaleString()}.`;
}
