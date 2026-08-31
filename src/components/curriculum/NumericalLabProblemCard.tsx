import React from "react";
import type { NumericalExercise } from "../../curriculum";
import { NumericalLabAnswerInput } from "./NumericalLabAnswerInput";
import { NumericalLabSolutionSteps } from "./NumericalLabSolutionSteps";
import { renderRichProblemText } from "./numericalLabUtils";

export interface NumericalLabProblemCardProps {
  readonly exercise: NumericalExercise;
  readonly activeIndex: number;
  readonly totalCount: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly studentInput: string;
  readonly onInputChange: (val: string) => void;
  readonly onVerify: () => void;
  readonly onClear: () => void;
  readonly inputError: string | null;
  readonly verificationResult: {
    readonly isCorrect: boolean;
    readonly errorPct: number;
    readonly feedback: string;
  } | null;
  readonly showSolution: boolean;
  readonly onToggleSolution: () => void;
}

export const NumericalLabProblemCard: React.FC<NumericalLabProblemCardProps> = ({
  exercise,
  activeIndex,
  totalCount,
  onPrev,
  onNext,
  studentInput,
  onInputChange,
  onVerify,
  onClear,
  inputError,
  verificationResult,
  showSolution,
  onToggleSolution,
}) => {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              background: "rgba(192, 132, 252, 0.2)",
              color: "#c084fc",
              marginRight: "8px",
            }}
          >
            TOLERANCE: ±{exercise.tolerance} {exercise.unit}
          </span>
          <h3
            data-testid="exercise-title"
            style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}
          >
            {exercise.title}
          </h3>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            data-testid="prev-problem-btn"
            disabled={activeIndex === 0}
            onClick={onPrev}
            style={{
              padding: "5px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: activeIndex === 0 ? "#475569" : "#cbd5e1",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: activeIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>
          <button
            data-testid="next-problem-btn"
            disabled={activeIndex === totalCount - 1}
            onClick={onNext}
            style={{
              padding: "5px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: activeIndex === totalCount - 1 ? "#475569" : "#cbd5e1",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: activeIndex === totalCount - 1 ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      </div>

      <div
        data-testid="problem-prompt-card"
        style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "14px",
          fontSize: "13px",
          lineHeight: 1.6,
          color: "#e2e8f0",
        }}
      >
        {renderRichProblemText(exercise.prompt)}
      </div>

      <div
        data-testid="parameters-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "8px",
        }}
      >
        {Object.entries(exercise.parameters).map(([key, val]) => (
          <div
            key={key}
            style={{
              background: "rgba(30, 41, 59, 0.5)",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "6px 10px",
            }}
          >
            <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, display: "block" }}>
              {key}
            </span>
            <span
              style={{
                fontSize: "13px",
                color: "#38bdf8",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {String(val)}
            </span>
          </div>
        ))}
      </div>

      <NumericalLabAnswerInput
        unit={exercise.unit}
        studentInput={studentInput}
        onInputChange={onInputChange}
        onVerify={onVerify}
        onClear={onClear}
        inputError={inputError}
        verificationResult={verificationResult}
        showSolution={showSolution}
        onToggleSolution={onToggleSolution}
      />

      {showSolution && <NumericalLabSolutionSteps solutionSteps={exercise.solutionSteps} />}
    </div>
  );
};
