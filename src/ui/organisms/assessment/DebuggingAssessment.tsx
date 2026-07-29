import { useState } from "react";

import type { DebuggingAssessmentPayload } from "../../../learning/assessment";
import type {
  AssessmentSubmissionContext,
  AssessmentSubmissionHandler,
} from "../../../learning/progress/types";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import { CodeCompletionAssessment } from "./CodeCompletionAssessment";
import { createAssessmentSubmission, pendingRubric } from "./submission";
import { Unavailable } from "./TraceAssessment";

export interface DebuggingAssessmentProps {
  readonly title: string;
  readonly payload?: DebuggingAssessmentPayload;
  readonly correctedReference?: string;
  readonly submissionContext: AssessmentSubmissionContext;
  readonly onSubmit: AssessmentSubmissionHandler;
}

export function DebuggingAssessment({
  title,
  payload,
  correctedReference,
  submissionContext,
  onSubmit,
}: DebuggingAssessmentProps): React.ReactElement {
  const [diagnosis, setDiagnosis] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");

  if (!payload) return <Unavailable title={title} mode="debugging" />;

  return (
    <section className="assessment-panel" aria-label={`${title} debugging assessment`}>
      <h2>Diagnose the violated invariant</h2>
      <Well padding="sm" className="assessment-code-well">
        <h3>Faulty starter</h3>
        <pre>{payload.faultyStarter}</pre>
      </Well>
      <div className="assessment-stack">
        {payload.evidence.map((evidence) => (
          <Well padding="sm" key={`${evidence.label}-${evidence.content}`}>
            <h3>{evidence.label}</h3>
            <pre>{evidence.content}</pre>
          </Well>
        ))}
      </div>
      <section className="assessment-list-section" aria-label="Failing tests">
        <h3>Failing tests</h3>
        <ul>
          {payload.failingTests.map((test) => (
            <li key={test}>{test}</li>
          ))}
        </ul>
      </section>
      <section className="assessment-list-section" aria-label="Hints">
        <h3>Hints</h3>
        <ul>
          {payload.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>
      <label className="assessment-field">
        <span>Diagnosis and correction</span>
        <textarea
          aria-label="Diagnosis and correction"
          value={diagnosis}
          onChange={(event) => setDiagnosis(event.target.value)}
        />
      </label>
      <Button
        variant="primary"
        onClick={() => {
          if (!diagnosis.trim()) {
            setMessage("Provide a diagnosis before revealing the corrected reference.");
            return;
          }
          const saved = onSubmit(
            createAssessmentSubmission({
              mode: "debugging",
              metadata: payload,
              context: submissionContext,
              response: { diagnosis: diagnosis.trim() },
              gradingStatus: "pending",
              score: 0,
              rubric: pendingRubric("diagnosis"),
            }),
          );
          setRevealed(true);
          setMessage(
            saved
              ? "Diagnosis saved for review."
              : "The corrected reference is shown, but the diagnosis could not be saved.",
          );
        }}
      >
        Reveal corrected reference
      </Button>
      {revealed ? (
        correctedReference ? (
          <Well padding="sm" className="assessment-code-well">
            <h3>Immutable corrected reference</h3>
            <pre>{correctedReference}</pre>
          </Well>
        ) : (
          <p className="assessment-status" role="status">
            No authored corrected reference is available.
          </p>
        )
      ) : null}
      {message ? (
        <p
          className="assessment-status"
          role={message.startsWith("Provide") || message.includes("could not") ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      {payload.completion ? (
        <CodeCompletionAssessment
          payload={payload.completion}
          submissionContext={submissionContext}
          onSubmit={onSubmit}
        />
      ) : null}
    </section>
  );
}
