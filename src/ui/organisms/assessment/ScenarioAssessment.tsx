import { useState } from "react";

import type { ScenarioAssessmentPayload } from "../../../learning/assessment";
import type {
  AssessmentSubmissionContext,
  AssessmentSubmissionHandler,
} from "../../../learning/progress/types";
import type { RubricDefinition, ScenarioPrompt } from "../../../learning/types";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import { createAssessmentSubmission, pendingRubricFromCriteria } from "./submission";

export interface ScenarioAssessmentProps {
  readonly title: string;
  readonly prompt: ScenarioPrompt;
  readonly payload?: ScenarioAssessmentPayload;
  readonly rubric: RubricDefinition;
  readonly submissionContext: AssessmentSubmissionContext;
  readonly onSubmit: AssessmentSubmissionHandler;
}

export function ScenarioAssessment({
  title,
  prompt,
  payload,
  rubric,
  submissionContext,
  onSubmit,
}: ScenarioAssessmentProps): React.ReactElement {
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const choices = payload?.choices;

  const save = () => {
    if (!decision.trim() || !rationale.trim()) {
      setMessage("Choose a constrained response and explain its rationale before saving.");
      return;
    }
    if (!payload) {
      setMessage("This response could not be saved because the authored variant is unavailable.");
      return;
    }
    const saved = onSubmit(
      createAssessmentSubmission({
        mode: "scenario",
        metadata: payload,
        context: submissionContext,
        response: {
          decision: decision.trim(),
          rationale: rationale.trim(),
          evidence,
        },
        gradingStatus: "pending",
        score: 0,
        rubric: pendingRubricFromCriteria(rubric.criteria),
      }),
    );
    setMessage(
      saved
        ? "Response saved for rubric review. This scenario has no fake exact-output grade."
        : "The response could not be saved. Its rubric review is still pending.",
    );
  };

  return (
    <section className="assessment-panel" aria-label={`${title} scenario assessment`}>
      <h2>Make a constrained decision</h2>
      <Well padding="sm">
        <p>{prompt.context}</p>
        <p>{prompt.question}</p>
        {prompt.constraints?.length ? (
          <ul>
            {prompt.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        ) : null}
      </Well>
      <label className="assessment-field">
        <span>Decision</span>
        {choices ? (
          <select
            aria-label="Decision"
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
          >
            <option value="">Choose a response</option>
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            aria-label="Decision"
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
          />
        )}
      </label>
      <label className="assessment-field">
        <span>Rationale</span>
        <textarea
          aria-label="Rationale"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
        />
      </label>
      {payload?.consequences ? (
        <p className="assessment-consequence">{payload.consequences}</p>
      ) : null}
      <section className="assessment-rubric" aria-label="Transparent rubric">
        <h3>Transparent rubric and self-evidence</h3>
        {rubric.criteria.map((criterion) => (
          <label className="assessment-rubric-row" key={criterion.id}>
            <span>
              <strong>{criterion.label}</strong> · {criterion.points} points
              <br />
              {criterion.description}
            </span>
            <textarea
              aria-label={`Evidence for ${criterion.label}`}
              placeholder="Point to the evidence in your response"
              value={evidence[criterion.id] ?? ""}
              onChange={(event) =>
                setEvidence((current) => ({ ...current, [criterion.id]: event.target.value }))
              }
            />
          </label>
        ))}
      </section>
      <Button variant="primary" onClick={save}>
        Save response
      </Button>
      {message ? (
        <p
          className="assessment-status"
          role={message.startsWith("Choose") || message.includes("could not") ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
