import { useState } from "react";

import type { TraceAssessmentPayload } from "../../../learning/assessment";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import { CodeCompletionAssessment } from "./CodeCompletionAssessment";

export interface TraceAssessmentProps {
  readonly title: string;
  readonly payload?: TraceAssessmentPayload;
}

export function TraceAssessment({ title, payload }: TraceAssessmentProps): React.ReactElement {
  const [prediction, setPrediction] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("Enter a prediction before revealing the authored state.");

  if (!payload) {
    return <Unavailable title={title} mode="trace" />;
  }

  const reveal = () => {
    if (!prediction.trim()) {
      setMessage("Enter a predicted next state before revealing the reference.");
      return;
    }
    setRevealed(true);
    setMessage(
      payload.referenceNextState
        ? "Reference state revealed. Compare it with your prediction."
        : "No authored reference state is available for this trace yet.",
    );
  };

  return (
    <section className="assessment-panel" aria-label={`${title} trace assessment`}>
      <h2>Predict the next state</h2>
      <p>{payload.prompt}</p>
      <Well padding="sm" className="assessment-code-well">
        <h3>Current state</h3>
        <pre>{payload.currentState}</pre>
      </Well>
      <label className="assessment-field">
        <span>Predicted next state</span>
        <textarea
          aria-label="Predicted next state"
          value={prediction}
          onChange={(event) => setPrediction(event.target.value)}
        />
      </label>
      <Button variant="primary" onClick={reveal}>
        Reveal next state
      </Button>
      {revealed && payload.referenceNextState ? (
        <Well padding="sm" className="assessment-code-well">
          <h3>Authored next state</h3>
          <pre>{payload.referenceNextState}</pre>
        </Well>
      ) : null}
      <p className="assessment-status" role="status" aria-live="polite">
        {message}
      </p>
      {payload.completion ? <CodeCompletionAssessment payload={payload.completion} /> : null}
    </section>
  );
}

export function Unavailable({ title, mode }: { title: string; mode: string }): React.ReactElement {
  return (
    <section className="assessment-panel" aria-label={`${title} ${mode} assessment`}>
      <h2>{title}</h2>
      <Well padding="sm">
        This {mode} assessment has no authored payload yet. It cannot invent a prompt, code, or
        reference answer.
      </Well>
    </section>
  );
}
