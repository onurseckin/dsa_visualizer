import { useState } from "react";

import type { CalculatorAssessmentPayload } from "../../../learning/assessment";
import { Button } from "../../atoms/Button";
import { Well } from "../../atoms/Well";
import { Unavailable } from "./TraceAssessment";

export interface CalculatorAssessmentProps {
  readonly title: string;
  readonly payload?: CalculatorAssessmentPayload;
}

export function CalculatorAssessment({
  title,
  payload,
}: CalculatorAssessmentProps): React.ReactElement {
  const [estimate, setEstimate] = useState("");
  const [exact, setExact] = useState("");
  const [unit, setUnit] = useState(payload?.result.unit ?? "");
  const [message, setMessage] = useState("");

  if (!payload) return <Unavailable title={title} mode="calculator" />;

  const check = () => {
    const estimateValue = Number(estimate);
    if (!estimate.trim() || !Number.isFinite(estimateValue)) {
      setMessage("Provide an estimate first so the exact result has context.");
      return;
    }
    const exactValue = Number(exact);
    if (!exact.trim() || !Number.isFinite(exactValue)) {
      setMessage("Provide a numeric exact result to check it against the authored tolerance.");
      return;
    }
    if (unit.trim() !== payload.result.unit) {
      setMessage(`Use the authored result unit: ${payload.result.unit}.`);
      return;
    }
    const withinTolerance = Math.abs(exactValue - payload.result.value) <= payload.result.tolerance;
    setMessage(
      withinTolerance
        ? "Your result is within the authored tolerance."
        : "Your result is outside the authored tolerance. Recheck the inputs and units.",
    );
  };

  return (
    <section className="assessment-panel" aria-label={`${title} calculator assessment`}>
      <h2>Estimate, then calculate</h2>
      <p>{payload.prompt}</p>
      <div className="assessment-input-grid">
        {payload.inputs.map((input) => (
          <label className="assessment-field" key={input.id}>
            <span>
              {input.label}
              {input.unit ? ` (${input.unit})` : ""}
            </span>
            <input
              aria-label={`Calculator input: ${input.label}`}
              defaultValue={input.defaultValue}
              type="text"
            />
          </label>
        ))}
      </div>
      <Well padding="sm" className="assessment-form-well">
        <label className="assessment-field">
          <span>Estimate ({payload.result.unit})</span>
          <input
            aria-label="Estimate"
            inputMode="decimal"
            type="number"
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
          />
        </label>
        <label className="assessment-field">
          <span>Exact result</span>
          <input
            aria-label="Exact result"
            inputMode="decimal"
            type="number"
            value={exact}
            onChange={(event) => setExact(event.target.value)}
          />
        </label>
        <label className="assessment-field">
          <span>Result unit</span>
          <input
            aria-label="Result unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </label>
      </Well>
      <Button variant="primary" onClick={check}>
        Check result
      </Button>
      {message ? (
        <p
          className="assessment-status"
          role={message.startsWith("Provide") || message.startsWith("Use") ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
      {message && !message.startsWith("Provide") && !message.startsWith("Use") ? (
        <p className="assessment-reference">
          Reference: {payload.result.value} {payload.result.unit} ± {payload.result.tolerance}
        </p>
      ) : null}
    </section>
  );
}
