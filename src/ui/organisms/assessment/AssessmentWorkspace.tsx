import { useState } from "react";

import { assessmentAttemptStorage, type AttemptStorage } from "../../../learning/progress/storage";
import {
  createAttemptRecord,
  type AssessmentSubmission,
  type AssessmentSubmissionContext,
} from "../../../learning/progress/types";
import type { LearningItem } from "../../../learning/types";
import { isAlgorithmLearningItem } from "../../../learning/types";
import { CalculatorAssessment } from "./CalculatorAssessment";
import { CapstoneAssessment } from "./CapstoneAssessment";
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
  const [confidence, setConfidence] = useState<AssessmentSubmissionContext["confidence"]>(3);
  const [invariantEvidence, setInvariantEvidence] = useState("");
  const [tradeoffEvidence, setTradeoffEvidence] = useState("");
  const [savedCount, setSavedCount] = useState(
    () => storage.load().filter((attempt) => attempt.itemId === item.id).length,
  );
  const [persistenceMessage, setPersistenceMessage] = useState("");
  const submissionContext: AssessmentSubmissionContext = {
    confidence,
    invariantEvidence,
    tradeoffEvidence,
  };

  const submit = (submission: AssessmentSubmission): boolean => {
    const timestamp = now();
    const dueAt = submission.delayedRetrievalDueAt;
    try {
      const record = createAttemptRecord({
        ...submission,
        itemId: item.id,
        delayedRetrievalCompletedAt:
          dueAt !== undefined && timestamp >= dueAt ? timestamp : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const saved = storage.save(record);
      if (saved) {
        setSavedCount(storage.load().filter((attempt) => attempt.itemId === item.id).length);
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
      </section>
      <div key={item.id}>{content}</div>
    </main>
  );
}
