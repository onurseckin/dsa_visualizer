import { useState } from "react";

import type { CodeCompletionPayload } from "../../../learning/assessment";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";

export interface CodeCompletionAssessmentProps {
  readonly payload: CodeCompletionPayload;
}

export function CodeCompletionAssessment({
  payload,
}: CodeCompletionAssessmentProps): React.ReactElement {
  const [completion, setCompletion] = useState("");
  const [why, setWhy] = useState("");
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!completion.trim() || !why.trim()) {
      setMessage("Provide both a completion and an invariant explanation before submitting.");
      return;
    }
    setMessage("Completion submitted for semantic review with its consequence explanation.");
  };

  return (
    <section className="assessment-completion" aria-label="Semantic code completion">
      <h3>Complete the decision, then explain it</h3>
      <p>{payload.prompt}</p>
      <Well padding="sm" className="assessment-code-well">
        <pre>{payload.context}</pre>
      </Well>
      <div className="assessment-list-section" aria-label="Required concepts">
        <p>Review focuses on these decision-bearing concepts:</p>
        <ul>
          {payload.requiredConcepts.map((concept) => (
            <li key={concept}>{concept}</li>
          ))}
        </ul>
      </div>
      <label className="assessment-field">
        <span>Semantic completion</span>
        <textarea
          aria-label="Semantic completion"
          value={completion}
          onChange={(event) => setCompletion(event.target.value)}
        />
      </label>
      <label className="assessment-field">
        <span>Why this preserves the invariant</span>
        <textarea
          aria-label="Why this preserves the invariant"
          value={why}
          onChange={(event) => setWhy(event.target.value)}
        />
      </label>
      <p className="assessment-consequence">{payload.consequencePrompt}</p>
      <Button onClick={submit}>Submit completion</Button>
      {message ? (
        <p className="assessment-status" role={message.startsWith("Provide") ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
