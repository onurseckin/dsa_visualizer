import { useState } from "react";

import type { AttemptReviewCriterion } from "../../../learning/progress/review";
import type { AssessmentAttemptRecord } from "../../../learning/progress/types";
import { Button } from "../../atoms/Button";

export interface DisplayReviewCriterion extends AttemptReviewCriterion {
  readonly description: string;
}

export interface AuthoredReviewReference {
  readonly ariaLabel: string;
  readonly title: string;
  readonly content: string;
}

export interface AttemptSelfReviewProps {
  readonly title: string;
  readonly attempt: AssessmentAttemptRecord;
  readonly criteria: readonly [DisplayReviewCriterion, ...DisplayReviewCriterion[]];
  readonly reference?: AuthoredReviewReference;
  readonly onReview: (metCriteria: readonly string[]) => boolean;
}

export function AttemptSelfReview({
  title,
  attempt,
  criteria,
  reference,
  onReview,
}: AttemptSelfReviewProps): React.ReactElement {
  const [metCriteria, setMetCriteria] = useState<readonly string[]>([]);
  const [message, setMessage] = useState(
    "Compare your response with the revealed reference or rubric, then mark only demonstrated criteria.",
  );

  const save = () => {
    const saved = onReview(metCriteria);
    setMessage(
      saved
        ? "Reviewed grade saved."
        : "The reviewed grade could not be saved; the pending attempt was preserved.",
    );
  };

  return (
    <section className="assessment-completion" aria-label={`${title} self review`}>
      <div>
        <p>Pending {attempt.mode} attempt</p>
        <h2>Complete an evidence-based self-review</h2>
      </div>
      <p>
        This is an explicit self-assessment, not an automatic correctness claim. Unchecked critical
        criteria remain critical failures.
      </p>
      <div className="assessment-review-evidence">
        <section aria-label="Saved attempt response">
          <h3>Your immutable saved response</h3>
          <pre>{JSON.stringify(attempt.response, null, 2)}</pre>
        </section>
        {reference ? (
          <section aria-label={reference.ariaLabel}>
            <h3>{reference.title}</h3>
            <pre>{reference.content}</pre>
          </section>
        ) : null}
      </div>
      <fieldset className="assessment-checklist">
        <legend>Demonstrated criteria</legend>
        {criteria.map((criterion) => (
          <label key={criterion.id} className="assessment-review-criterion">
            <input
              type="checkbox"
              checked={metCriteria.includes(criterion.id)}
              onChange={(event) =>
                setMetCriteria((current) =>
                  event.target.checked
                    ? [...current, criterion.id]
                    : current.filter((id) => id !== criterion.id),
                )
              }
            />
            <span>
              <strong>{criterion.label}</strong> · {criterion.points}{" "}
              {criterion.points === 1 ? "point" : "points"}
              {criterion.critical ? " · critical" : ""}
              <br />
              {criterion.description}
            </span>
          </label>
        ))}
      </fieldset>
      <Button variant="primary" onClick={save}>
        Save reviewed grade
      </Button>
      <p
        className="assessment-status"
        role={message.includes("could not") ? "alert" : "status"}
        aria-live="polite"
      >
        {message}
      </p>
    </section>
  );
}
