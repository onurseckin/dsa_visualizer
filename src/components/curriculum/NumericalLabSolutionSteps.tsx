import React from "react";
import { renderRichProblemText } from "./numericalLabUtils";

export interface NumericalLabSolutionStepsProps {
  readonly solutionSteps: readonly string[];
}

export const NumericalLabSolutionSteps: React.FC<NumericalLabSolutionStepsProps> = ({
  solutionSteps,
}) => {
  return (
    <div
      data-testid="solution-steps-panel"
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(192, 132, 252, 0.3)",
        borderRadius: "10px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: 800, color: "#c084fc" }}>
        📐 MATHEMATICAL DERIVATION STEPS
      </div>
      {solutionSteps.map((step, sIdx) => (
        <div
          key={sIdx}
          data-testid={`solution-step-${sIdx}`}
          style={{
            padding: "8px 10px",
            background: "rgba(30, 41, 59, 0.4)",
            borderRadius: "6px",
            fontSize: "12px",
            lineHeight: 1.5,
            borderLeft: "3px solid #38bdf8",
          }}
        >
          {renderRichProblemText(step)}
        </div>
      ))}
    </div>
  );
};
