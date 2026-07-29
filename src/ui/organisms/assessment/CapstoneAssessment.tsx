import { useState } from "react";

import type { CapstoneAssessmentPayload } from "../../../learning/assessment";
import type {
  AssessmentSubmissionContext,
  AssessmentSubmissionHandler,
} from "../../../learning/progress/types";
import type { RubricDefinition, ScenarioPrompt } from "../../../learning/types";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import { createAssessmentSubmission, pendingRubricFromCriteria } from "./submission";

export interface CapstoneAssessmentProps {
  readonly title: string;
  readonly prompt: ScenarioPrompt;
  readonly payload?: CapstoneAssessmentPayload;
  readonly rubric: RubricDefinition;
  readonly submissionContext: AssessmentSubmissionContext;
  readonly onSubmit: AssessmentSubmissionHandler;
}

export function CapstoneAssessment({
  title,
  prompt,
  payload,
  rubric,
  submissionContext,
  onSubmit,
}: CapstoneAssessmentProps): React.ReactElement {
  const [design, setDesign] = useState("");
  const [checked, setChecked] = useState<readonly string[]>([]);
  const [timeline, setTimeline] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const critical = rubric.criteria.filter((criterion) => criterion.critical);

  if (!payload) {
    return (
      <section className="assessment-panel" aria-label={`${title} capstone assessment`}>
        <h2>{title}</h2>
        <Well padding="sm">
          This capstone needs an authored checklist and incident timeline before it can be assessed.
        </Well>
      </section>
    );
  }

  const toggleChecklist = (id: string) => {
    setChecked((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const save = () => {
    if (!design.trim()) {
      setMessage("Describe the proposed design before saving the capstone response.");
      return;
    }
    const saved = onSubmit(
      createAssessmentSubmission({
        mode: "capstone",
        metadata: payload,
        context: submissionContext,
        response: {
          design: design.trim(),
          checklist: checked,
          incidentTimeline: timeline,
          rubric: {
            criteria: rubric.criteria.map((criterion) => ({
              id: criterion.id,
              label: criterion.label,
              description: criterion.description,
              points: criterion.points,
              ...(criterion.critical === undefined ? {} : { critical: criterion.critical }),
            })),
          },
        },
        gradingStatus: "pending",
        score: 0,
        rubric: pendingRubricFromCriteria(rubric.criteria),
      }),
    );
    setMessage(
      saved
        ? "Capstone response saved for analytic rubric review."
        : "Capstone response was not saved. No analytic review was queued.",
    );
  };

  return (
    <section className="assessment-panel" aria-label={`${title} capstone assessment`}>
      <h2>Design and incident exercise</h2>
      <Well padding="sm">
        <p>{prompt.context}</p>
        <p>{prompt.question}</p>
      </Well>
      <label className="assessment-field">
        <span>Design response</span>
        <textarea
          aria-label="Design response"
          value={design}
          onChange={(event) => setDesign(event.target.value)}
        />
      </label>
      <fieldset className="assessment-checklist">
        <legend>Design checklist</legend>
        {payload.checklist.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={() => toggleChecklist(item.id)}
            />{" "}
            {item.label}
          </label>
        ))}
      </fieldset>
      <section className="assessment-timeline" aria-label="Incident timeline">
        <h3>Incident timeline</h3>
        {payload.incidentTimeline.map((entry) => (
          <label className="assessment-field" key={entry.id}>
            <span>{entry.label}</span>
            <textarea
              aria-label={`${entry.label} incident timeline`}
              value={timeline[entry.id] ?? ""}
              onChange={(event) =>
                setTimeline((current) => ({ ...current, [entry.id]: event.target.value }))
              }
            />
          </label>
        ))}
      </section>
      <section className="assessment-rubric" aria-label="Capstone rubric">
        <h3>Analytic rubric</h3>
        <ul>
          {rubric.criteria.map((criterion) => (
            <li key={criterion.id}>
              <strong>{criterion.label}</strong> · {criterion.points} points —{" "}
              {criterion.description}
            </li>
          ))}
        </ul>
        {critical.length ? (
          <p className="assessment-critical">
            Critical criteria are never averaged away:{" "}
            {critical.map((criterion) => criterion.label).join(", ")}.
          </p>
        ) : null}
      </section>
      <Button variant="primary" onClick={save}>
        Save capstone response
      </Button>
      {message ? (
        <p
          className="assessment-status"
          role={
            message.startsWith("Describe") || message.includes("not saved") ? "alert" : "status"
          }
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
